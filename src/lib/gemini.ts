// src/lib/gemini.ts
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import type { RepoSnapshot } from './github'
import { detectTechStack, collectDocUrls } from './tech-map'
import type { DetectedTech } from './tech-map'

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT
// One instance at module level — safe for Cloudflare Workers.
// ─────────────────────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalysisTechEntry {
  name: string
  package: string
  version: string
  docsUrl: string
}

export interface AnalysisFinding {
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
  file?: string
  suggestion: string
  /** The exact documentation URL that backs this finding — never empty. */
  docSource: string
}

export interface GeminiAnalysisResult {
  summary: string
  techStack: AnalysisTechEntry[]
  findings: AnalysisFinding[]
}

// ─────────────────────────────────────────────────────────────────────────────
// DOC FETCHER (internal)
// Fetches plain text from a documentation URL.
// We strip all HTML so only prose, headings, and code snippets remain.
// A tight per-URL timeout prevents slow doc sites from blocking the analysis.
// ─────────────────────────────────────────────────────────────────────────────

const DOC_FETCH_TIMEOUT_MS = 6_000
const DOC_MAX_CHARS = 6_000   // per URL — keeps the context window manageable
const MAX_DOCS_TO_FETCH = 8   // cap total doc pages so we stay under ~60 s

async function fetchDocText(url: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DOC_FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Docunect/1.0 (documentation analysis bot)',
        'Accept': 'text/html,application/xhtml+xml,text/plain',
      },
    })

    if (!res.ok) return ''

    const html = await res.text()
    return stripHtml(html).slice(0, DOC_MAX_CHARS)
  } catch {
    // Timeout, network error, or CORS block — silently skip this URL
    return ''
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Converts HTML to readable plain text.
 * Removes scripts, styles, nav, and header/footer chrome so Gemini only reads
 * the actual documentation prose.
 */
function stripHtml(html: string): string {
  return html
    // Remove script and style blocks entirely
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove navigation chrome
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    // Convert block tags to newlines so structure is readable
    .replace(/<\/?(h[1-6]|p|li|tr|div|section|article)[^>]*>/gi, '\n')
    // Strip remaining tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#x27;/g, "'")
    // Collapse whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTATION CONTEXT BUILDER
// Fetches docs for all detected techs and assembles them into a single
// context block that will be injected verbatim into the Gemini prompt.
// ─────────────────────────────────────────────────────────────────────────────

interface DocBlock {
  tech: string
  url: string
  type: 'docs' | 'migration' | 'changelog'
  content: string
}

async function buildDocContext(stack: DetectedTech[]): Promise<DocBlock[]> {
  // Collect all URLs (primary docs + migration guides + changelogs)
  const allUrls = collectDocUrls(stack)

  // Prioritise: docs first, then migration, then changelog
  // and cap total fetches to keep latency reasonable
  const ordered = [
    ...allUrls.filter((u) => u.type === 'docs'),
    ...allUrls.filter((u) => u.type === 'migration'),
    ...allUrls.filter((u) => u.type === 'changelog'),
  ].slice(0, MAX_DOCS_TO_FETCH)

  // Fetch all in parallel
  const results = await Promise.all(
    ordered.map(async (entry) => {
      const content = await fetchDocText(entry.url)
      return { ...entry, content }
    }),
  )

  // Drop entries where the fetch returned nothing useful
  return results.filter((b) => b.content.length > 100)
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON SCHEMA
// Tells Gemini exactly what shape to return so we can safely JSON.parse it.
// ─────────────────────────────────────────────────────────────────────────────

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    summary: {
      type: SchemaType.STRING,
      description: 'A 2–4 sentence plain-English summary of what was found.',
    },
    techStack: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name:    { type: SchemaType.STRING },
          package: { type: SchemaType.STRING },
          version: { type: SchemaType.STRING },
          docsUrl: { type: SchemaType.STRING },
        },
        required: ['name', 'package', 'version', 'docsUrl'],
      },
    },
    findings: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          severity: {
            type: SchemaType.STRING,
            // Gemini will respect this list via the schema enum hint
            format: 'enum',
            enum: ['error', 'warning', 'info'],
          },
          title:       { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          file:        { type: SchemaType.STRING },
          suggestion:  { type: SchemaType.STRING },
          docSource:   { type: SchemaType.STRING },
        },
        required: ['severity', 'title', 'description', 'suggestion', 'docSource'],
      },
    },
  },
  required: ['summary', 'techStack', 'findings'],
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// This is the most important part of the "docs-only" guarantee.
// We are explicit, repetitive, and use visual separators on purpose —
// large-context models respond better to clearly delimited sections.
// ─────────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(
  docBlocks: DocBlock[],
  techStack: DetectedTech[],
  snapshot: RepoSnapshot,
): string {
  const docSection = docBlocks
    .map(
      (b) =>
        `### [${b.tech}] ${b.type.toUpperCase()} — source: ${b.url}\n\n${b.content}`,
    )
    .join('\n\n' + '─'.repeat(80) + '\n\n')

  const techList = techStack
    .map((t) => `- ${t.name} (package: ${t.package}, version in repo: ${t.version})`)
    .join('\n')

  const codeSection = [
    snapshot.packageJson  && `### package.json\n\`\`\`json\n${snapshot.packageJson.slice(0, 3000)}\n\`\`\``,
    snapshot.tsConfig     && `### tsconfig.json\n\`\`\`json\n${snapshot.tsConfig.slice(0, 2000)}\n\`\`\``,
    snapshot.buildConfig  && `### Build config\n\`\`\`\n${snapshot.buildConfig.slice(0, 2000)}\n\`\`\``,
    snapshot.envExample   && `### .env.example\n\`\`\`\n${snapshot.envExample.slice(0, 1000)}\n\`\`\``,
  ]
    .filter(Boolean)
    .join('\n\n')

  return `\
You are the Docunect documentation analysis engine.

${'═'.repeat(80)}
ABSOLUTE RULES — READ THESE BEFORE ANYTHING ELSE
${'═'.repeat(80)}

RULE 1 — DOCUMENTATION ONLY
You MUST derive every single finding, suggestion, and claim EXCLUSIVELY from
the documentation text provided in the "DOCUMENTATION SOURCES" section below.

RULE 2 — NO TRAINING DATA
You MUST NOT use any knowledge from your pre-training or fine-tuning.
You MUST NOT suggest anything that is not explicitly stated in the provided docs.
Pretend you know nothing about these technologies except what is written below.

RULE 3 — CITE YOUR SOURCE
Every finding MUST include a "docSource" field containing the exact URL of the
documentation page where the evidence was found. If you cannot find a URL for a
finding, DO NOT include that finding.

RULE 4 — SILENCE OVER HALLUCINATION
If the provided documentation does not cover a topic, say nothing about it.
An empty findings array is correct and acceptable — it is NOT a failure.

RULE 5 — SEVERITY DEFINITIONS (use these exact strings)
  "error"   — deprecated API / breaking change / security issue stated in the docs
  "warning" — migration required / config mismatch described in the docs
  "info"    — improvement / best practice explicitly recommended in the docs

${'═'.repeat(80)}

DETECTED TECH STACK (cross-reference these with the docs below):
${techList}

${'═'.repeat(80)}
REPOSITORY FILES
${'═'.repeat(80)}

${codeSection || '(no config files could be read)'}

${'═'.repeat(80)}
DOCUMENTATION SOURCES  ← YOUR ONLY ALLOWED SOURCE OF TRUTH
${'═'.repeat(80)}

${docSection || '(no documentation could be fetched — return an empty findings array)'}

${'═'.repeat(80)}
YOUR TASK
${'═'.repeat(80)}

1. Read every documentation block above carefully.
2. Compare the repository files against what the documentation says is correct,
   current, and recommended.
3. Identify any mismatches, deprecated patterns, missing required configs, or
   available upgrades that are EXPLICITLY described in the docs.
4. Return a JSON object that strictly follows the provided response schema.
5. Do NOT include any findings you cannot back with a "docSource" URL from above.
`
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// This is the function called by the server function in src/server/analysis.ts
// ─────────────────────────────────────────────────────────────────────────────

export async function analyzeRepository(
  snapshot: RepoSnapshot,
): Promise<GeminiAnalysisResult> {
  // ── 1. Parse package.json ─────────────────────────────────────────────────
  if (!snapshot.packageJson) {
    return {
      summary: 'No package.json found in this repository. Analysis cannot proceed.',
      techStack: [],
      findings: [],
    }
  }

  let pkg: Record<string, unknown>
  try {
    pkg = JSON.parse(snapshot.packageJson)
  } catch {
    return {
      summary: 'package.json could not be parsed. Please ensure it is valid JSON.',
      techStack: [],
      findings: [],
    }
  }

  // ── 2. Detect tech stack ─────────────────────────────────────────────────
  const allDeps = [
    ...Object.entries((pkg.dependencies as Record<string, string>) ?? {}).map(
      ([name, version]) => ({ name, version }),
    ),
    ...Object.entries((pkg.devDependencies as Record<string, string>) ?? {}).map(
      ([name, version]) => ({ name, version }),
    ),
  ]

  const techStack = detectTechStack(allDeps)

  // If nothing in the package.json maps to our doc catalogue, return early.
  if (techStack.length === 0) {
    return {
      summary:
        'None of the packages in this repository matched our documentation catalogue. ' +
        'No documentation-backed analysis could be performed.',
      techStack: [],
      findings: [],
    }
  }

  // ── 3. Fetch documentation ────────────────────────────────────────────────
  const docBlocks = await buildDocContext(techStack)

  // ── 4. Build prompt ───────────────────────────────────────────────────────
  const prompt = buildSystemPrompt(docBlocks, techStack, snapshot)

  // ── 5. Call Gemini ────────────────────────────────────────────────────────
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA as any,
      // Temperature 0 = maximally deterministic — we want factual analysis,
      // not creative generation.
      temperature: 0,
    },
  })

  const result = await model.generateContent(prompt)
  const raw = result.response.text()

  // ── 6. Parse + validate ───────────────────────────────────────────────────
  let parsed: GeminiAnalysisResult
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Gemini occasionally wraps JSON in a markdown fence despite the config;
    // try to extract it.
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match?.[1]) {
      parsed = JSON.parse(match[1])
    } else {
      throw new Error(`Gemini returned non-JSON response: ${raw.slice(0, 200)}`)
    }
  }

  // ── 7. Enforce docSource is always present ────────────────────────────────
  // Belt-and-suspenders: drop any finding that slipped through without a source.
  parsed.findings = (parsed.findings ?? []).filter(
    (f) => f.docSource && f.docSource.trim().length > 0,
  )

  // ── 8. Inject detected tech stack metadata ────────────────────────────────
  // If Gemini's techStack is sparse, supplement it with our own detection.
  if (!parsed.techStack || parsed.techStack.length === 0) {
    parsed.techStack = techStack.map((t) => ({
      name:    t.name,
      package: t.package,
      version: t.version,
      docsUrl: t.docsUrl,
    }))
  }

  return parsed
}

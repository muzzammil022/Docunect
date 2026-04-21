// src/lib/doc-fetcher.ts
// Fetches official documentation pages and converts them to plain text.
// This is the ONLY source of truth for the Gemini analysis engine —
// we fetch the docs ourselves and pass the text to Gemini so it cannot
// fall back to its own training data.

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum characters to keep from a single documentation page. */
const MAX_PAGE_CHARS = 12_000

/** How long we wait for a documentation page to respond (ms). */
const FETCH_TIMEOUT_MS = 6_000

// ─────────────────────────────────────────────────────────────────────────────
// HTML → PLAIN TEXT
// A lightweight stripper that works without a DOM (edge / Cloudflare Workers).
// Order matters: script/style blocks must be removed before generic tag removal.
// ─────────────────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return (
    html
      // Remove everything between <script> tags
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      // Remove everything between <style> tags
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      // Remove nav, header, footer, aside — not useful for analysis
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, ' ')
      // Preserve heading text by adding a newline before stripping the tag
      .replace(/<h[1-6][^>]*>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      // Paragraph / block-level breaks
      .replace(/<\/?(p|div|section|article|li|tr|blockquote)[^>]*>/gi, '\n')
      // Inline elements — just remove the tags, keep the text
      .replace(/<[^>]+>/g, '')
      // HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&hellip;/g, '…')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      // Collapse runs of blank lines to at most two
      .replace(/\n{3,}/g, '\n\n')
      // Collapse horizontal whitespace
      .replace(/[ \t]+/g, ' ')
      // Trim each line
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n')
      .trim()
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMEOUT-SAFE FETCH
// AbortController gives us a clean, edge-compatible timeout.
// ─────────────────────────────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Identify ourselves politely so docs sites don't block us
        'User-Agent':
          'Docunect/1.0 (+https://docunect.dev; documentation analysis bot)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    return response
  } finally {
    clearTimeout(timer)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export interface FetchedDoc {
  url: string
  tech: string
  type: 'docs' | 'migration' | 'changelog'
  /** Plain-text content, already truncated to MAX_PAGE_CHARS */
  content: string
  /** true if we got real content, false if the fetch failed / timed out */
  ok: boolean
}

/**
 * Fetches a single documentation URL and returns its plain-text content.
 * Never throws — on any error it returns an FetchedDoc with ok = false.
 */
export async function fetchDocPage(
  url: string,
  tech: string,
  type: FetchedDoc['type'] = 'docs',
): Promise<FetchedDoc> {
  const base: Omit<FetchedDoc, 'content' | 'ok'> = { url, tech, type }

  try {
    const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS)

    if (!response.ok) {
      console.warn(`[doc-fetcher] ${url} returned HTTP ${response.status}`)
      return { ...base, content: '', ok: false }
    }

    const contentType = response.headers.get('content-type') ?? ''

    // If the server returns JSON (some doc sites have JSON APIs), skip it —
    // we only know how to handle HTML.
    if (contentType.includes('application/json')) {
      return { ...base, content: '', ok: false }
    }

    const html = await response.text()
    const text = stripHtml(html)

    if (text.length < 50) {
      // Suspiciously short — probably a JS-only SPA shell with no static text
      console.warn(`[doc-fetcher] ${url} returned very little text (${text.length} chars)`)
      return { ...base, content: '', ok: false }
    }

    return {
      ...base,
      content: text.slice(0, MAX_PAGE_CHARS),
      ok: true,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    // AbortError = our timeout fired
    const isTimeout = message.includes('abort') || message.includes('timed out')
    console.warn(
      `[doc-fetcher] ${url} ${isTimeout ? 'timed out' : 'failed'}: ${message}`,
    )
    return { ...base, content: '', ok: false }
  }
}

/**
 * Fetches multiple documentation URLs concurrently.
 *
 * @param urls  Array of { url, tech, type } objects (from collectDocUrls)
 * @param limit Maximum number of concurrent requests (default 5)
 *
 * Returns only the pages where ok = true.
 */
export async function fetchDocPages(
  urls: Array<{ url: string; tech: string; type: FetchedDoc['type'] }>,
  limit = 5,
): Promise<FetchedDoc[]> {
  const results: FetchedDoc[] = []

  // Process in batches of `limit` to avoid hammering doc servers
  for (let i = 0; i < urls.length; i += limit) {
    const batch = urls.slice(i, i + limit)
    const batchResults = await Promise.all(
      batch.map(({ url, tech, type }) => fetchDocPage(url, tech, type)),
    )
    results.push(...batchResults)
  }

  return results.filter((doc) => doc.ok)
}

/**
 * Formats fetched docs into a single structured string that gets injected
 * into the Gemini prompt.  Each section is clearly delimited so the model
 * can cite sources accurately.
 */
export function buildDocContext(docs: FetchedDoc[]): string {
  if (docs.length === 0) {
    return '(No documentation could be fetched for the detected tech stack.)'
  }

  return docs
    .map((doc) => {
      const label =
        doc.type === 'migration'
          ? `${doc.tech} — Migration Guide`
          : doc.type === 'changelog'
            ? `${doc.tech} — Changelog / Release Notes`
            : `${doc.tech} — Official Documentation`

      return [
        `${'─'.repeat(72)}`,
        `SOURCE: ${label}`,
        `URL: ${doc.url}`,
        `${'─'.repeat(72)}`,
        doc.content,
        '',
      ].join('\n')
    })
    .join('\n')
}

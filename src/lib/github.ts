// src/lib/github.ts
import { Octokit } from '@octokit/rest'
import { db } from '@/src/db'
import { accounts } from '@/src/db/schema'
import { eq, and } from 'drizzle-orm'

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT
// ─────────────────────────────────────────────────────────────────────────────

export function createGitHubClient(accessToken: string) {
  return new Octokit({
    auth: accessToken,
    userAgent: 'Docunect/1.0',
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN RETRIEVAL
// Gets the GitHub OAuth access token we stored in the accounts table
// after the user authenticated via better-auth + GitHub provider.
// ─────────────────────────────────────────────────────────────────────────────

export async function getGitHubAccessToken(userId: string): Promise<string | null> {
  const rows = await db
    .select({ accessToken: accounts.accessToken })
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, userId),
        eq(accounts.providerId, 'github'),
      ),
    )
    .limit(1)

  return rows[0]?.accessToken ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// REPO LISTING
// Fetches all repos the authenticated user has access to.
// We ask for both owner + collaborator repos — same scope Vercel shows.
// Sorted by last-updated so recently worked-on repos appear first.
// ─────────────────────────────────────────────────────────────────────────────

export interface GitHubRepo {
  githubId:      number
  name:          string
  fullName:      string
  description:   string | null
  isPrivate:     boolean
  defaultBranch: string
  language:      string | null
  url:           string
  updatedAt:     string | null
}

export async function listUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const octokit = createGitHubClient(accessToken)

  // GitHub paginates at 100 per page — collect all pages
  const allRepos: GitHubRepo[] = []
  let page = 1

  while (true) {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      affiliation: 'owner,collaborator',
      sort:        'updated',
      direction:   'desc',
      per_page:    100,
      page,
    })

    if (data.length === 0) break

    for (const repo of data) {
      allRepos.push({
        githubId:      repo.id,
        name:          repo.name,
        fullName:      repo.full_name,
        description:   repo.description ?? null,
        isPrivate:     repo.private,
        defaultBranch: repo.default_branch ?? 'main',
        language:      repo.language ?? null,
        url:           repo.html_url,
        updatedAt:     repo.updated_at ?? null,
      })
    }

    // If we got fewer than 100 we've reached the last page
    if (data.length < 100) break
    page++
  }

  return allRepos
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE CONTENT
// Fetches a single file from a GitHub repo by path.
// Returns null if the file doesn't exist or the request fails.
// GitHub returns file content base64-encoded, so we decode it here.
// ─────────────────────────────────────────────────────────────────────────────

export async function getRepoFile(
  accessToken: string,
  owner:       string,
  repo:        string,
  path:        string,
): Promise<string | null> {
  const octokit = createGitHubClient(accessToken)

  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path })

    // getContent can return a file, directory listing, or submodule object
    if (Array.isArray(data) || data.type !== 'file') return null

    // data.content is base64 with line-breaks; decode it
    const decoded = Buffer.from(data.content, 'base64').toString('utf-8')
    return decoded
  } catch {
    // 404 = file doesn't exist in this repo; any other error we also ignore
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REPO SNAPSHOT
// Fetches all the files we care about for analysis in one go.
// We keep it to the config / manifest files — we don't clone the whole repo.
// ─────────────────────────────────────────────────────────────────────────────

export interface RepoSnapshot {
  packageJson:   string | null   // package.json
  tsConfig:      string | null   // tsconfig.json
  buildConfig:   string | null   // vite.config.ts / next.config.js / etc.
  envExample:    string | null   // .env.example  (never .env — no secrets)
}

const BUILD_CONFIG_CANDIDATES = [
  'vite.config.ts',
  'vite.config.js',
  'next.config.ts',
  'next.config.js',
  'nuxt.config.ts',
  'astro.config.mjs',
  'svelte.config.js',
  'remix.config.js',
  'wrangler.jsonc',
  'wrangler.toml',
]

export async function getRepoSnapshot(
  accessToken: string,
  fullName:    string,             // "owner/repo"
): Promise<RepoSnapshot> {
  const [owner, repo] = fullName.split('/')

  // Fetch package.json and tsconfig in parallel
  const [packageJson, tsConfig, envExample] = await Promise.all([
    getRepoFile(accessToken, owner, repo, 'package.json'),
    getRepoFile(accessToken, owner, repo, 'tsconfig.json'),
    getRepoFile(accessToken, owner, repo, '.env.example'),
  ])

  // Try build config files one at a time until we find one
  let buildConfig: string | null = null
  for (const candidate of BUILD_CONFIG_CANDIDATES) {
    buildConfig = await getRepoFile(accessToken, owner, repo, candidate)
    if (buildConfig) break
  }

  return { packageJson, tsConfig, buildConfig, envExample }
}

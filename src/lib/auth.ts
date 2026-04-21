// src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db'
import * as schema from '../db/schema'

export const auth = betterAuth({
  // The base URL must match wherever your app is hosted.
  // In production set BETTER_AUTH_URL as a Cloudflare secret.
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET!,

  database: drizzleAdapter(db, {
    provider: 'pg',
    // usePlural makes the adapter look for "users", "sessions", etc.
    // instead of "user", "session" — matching our schema table names.
    usePlural: true,
    schema: {
      users:         schema.users,
      sessions:      schema.sessions,
      accounts:      schema.accounts,
      verifications: schema.verifications,
    },
  }),

  socialProviders: {
    github: {
      clientId:     process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // "repo" gives read/write access to public + private repos.
      // This is what allows us to fetch package.json, config files, etc.
      // Users will see GitHub's standard permission screen listing exactly
      // what we're requesting — same flow as Vercel / Netlify.
      scope: ['read:user', 'user:email', 'repo'],
    },
  },

  session: {
    // Sessions live for 30 days, refreshed on each request.
    expiresIn:         60 * 60 * 24 * 30,
    updateAge:         60 * 60 * 24,      // re-issue cookie if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge:  60 * 5,                    // client-side cookie cache: 5 minutes
    },
  },

  // Restrict sign-up to GitHub only — no email/password.
  emailAndPassword: {
    enabled: false,
  },
})

// ─── Inferred types ──────────────────────────────────────────────────────────
export type AuthSession = typeof auth.$Infer.Session
export type AuthUser    = typeof auth.$Infer.Session.user

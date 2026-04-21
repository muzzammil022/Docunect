// src/lib/auth-client.ts
// Browser-side better-auth client.
// Import this in React components — never in server-only files.
// The server-side counterpart lives in src/lib/auth.ts

import { createAuthClient } from 'better-auth/react'

// No baseURL needed in the browser — better-auth defaults to the current
// page's origin, which means it automatically works in both dev
// (http://localhost:3000) and production without any env var juggling.
export const authClient = createAuthClient()

// ─── Convenience re-exports ───────────────────────────────────────────────────
// These are typed wrappers so the rest of the app never imports from
// 'better-auth/react' directly — only from this file.

/**
 * Redirect the browser to GitHub OAuth.
 * Better-auth handles the full OAuth dance and creates the session.
 *
 * @param callbackURL  Where to land after GitHub approves the login.
 *                     Defaults to the dashboard repositories page.
 */
export async function signInWithGitHub(
  callbackURL = '/dashboard/repositories',
) {
  await authClient.signIn.social({
    provider: 'github',
    callbackURL,
  })
}

/**
 * Revoke the current session and return the sign-out result.
 * After calling this you should navigate the user to "/" or "/login".
 */
export async function signOut() {
  return authClient.signOut()
}

/**
 * React hook — returns the live session from better-auth.
 *
 * { data, isPending, error }
 *   data      — the Session object (user + session metadata), or null
 *   isPending — true on the very first render before the check completes
 *   error     — any network / auth error
 *
 * Use this inside React components that need to react to auth state changes
 * (e.g. show a loading spinner while the session check is in flight).
 * For the initial SSR render, prefer the user returned by the root loader.
 */
export const useSession = authClient.useSession

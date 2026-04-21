// src/server/user.ts
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "@/src/lib/auth";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER  (used inside other server functions, not exported to the client)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads the session cookie from the current request and returns the session +
 * user. Throws a 401 error if the user is not signed in.
 *
 * Call this at the top of any server function that needs authentication:
 *
 *   const { user } = await requireAuth()
 */
export async function requireAuth() {
  const request = getRequest();

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    session,
    user: session.user,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getCurrentUser
 * Returns the currently signed-in user, or null if the visitor is anonymous.
 * Safe to call on every page load — never throws.
 */
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const request = getRequest();

      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user) return null;

      return {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
        emailVerified: session.user.emailVerified,
      };
    } catch {
      return null;
    }
  },
);

/**
 * getSession
 * Returns the full session object (user + session metadata), or null.
 * Useful when you need the raw session token / expiry on the client.
 */
export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const request = getRequest();

      const session = await auth.api.getSession({
        headers: request.headers,
      });

      return session ?? null;
    } catch {
      return null;
    }
  },
);

/**
 * signOut
 * Revokes the current session server-side and clears the session cookie.
 */
export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const request = getRequest();

  await auth.api.signOut({
    headers: request.headers,
  });

  return { success: true };
});

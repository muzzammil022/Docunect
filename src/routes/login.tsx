// src/routes/login.tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createAuthClient } from "better-auth/react";

import { useState } from "react";
import { getCurrentUser } from "@/src/server/user";

// ─────────────────────────────────────────────────────────────────────────────
// Better Auth browser client
// baseURL defaults to the current origin — works in both dev and prod.
// ─────────────────────────────────────────────────────────────────────────────
const authClient = createAuthClient();

// ─────────────────────────────────────────────────────────────────────────────
// Route
// ─────────────────────────────────────────────────────────────────────────────
export const Route = createFileRoute("/login")({
  // If the user is already signed in, skip the login page entirely.
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGitHubSignIn() {
    setLoading(true);
    setError(null);
    try {
      // better-auth redirects the browser to GitHub, then back to our callback,
      // then to /dashboard/repositories where the user picks their repos.
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard/repositories",
      });
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted px-4">
      {/* Card */}
      <div className="w-full max-w-sm bg-background border border-border rounded-2xl shadow-sm p-8 flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Docunect
          </span>
          <p className="text-sm text-foreground/60 max-w-xs leading-relaxed">
            Connect your GitHub repo and get AI-powered analysis backed
            exclusively by official documentation.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-border" />

        {/* GitHub Sign In */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleGitHubSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-foreground text-background text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {loading ? (
              <>
                <Spinner />
                Redirecting to GitHub…
              </>
            ) : (
              <>
                <GitHubIcon />
                Continue with GitHub
              </>
            )}
          </button>

          {error && (
            <p className="text-xs text-center text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Fine print */}
        <p className="text-xs text-foreground/40 text-center leading-relaxed">
          We request{" "}
          <span className="font-medium text-foreground/60">repo</span> scope so
          we can read your{" "}
          <span className="font-medium text-foreground/60">package.json</span>{" "}
          and config files. We never write to your repositories.
        </p>
      </div>

      {/* Background decoration */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tiny inline spinner (no extra dependency needed)
// ─────────────────────────────────────────────────────────────────────────────
function GitHubIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

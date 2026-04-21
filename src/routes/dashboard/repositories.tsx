// src/routes/dashboard/repositories.tsx
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { getCurrentUser } from "@/src/server/user";
import {
  listAllRepos,
  syncReposFromGitHub,
  connectRepo,
  disconnectRepo,
} from "@/src/server/repos";
import type { Repository } from "@/src/db/schema";
import { DashboardSidebar } from "@/src/components/dashboard-sidebar";
import { useSidebar } from "@/src/components/sidebar-context";
import { cn } from "@/src/lib/utils";
import {
  GitBranch,
  Search,
  RefreshCw,
  Lock,
  Globe,
  CheckCircle,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Route
// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/dashboard/repositories")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },

  loader: async () => {
    const repos = await listAllRepos();
    return { repos };
  },

  component: RepositoriesPage,
});

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

function RepositoriesPage() {
  const { repos: initialRepos } = Route.useLoaderData();
  const { isCollapsed } = useSidebar();

  const [repos, setRepos] = useState<Repository[]>(initialRepos);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return repos;
    return repos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q),
    );
  }, [repos, search]);

  const connected = repos.filter((r) => r.isConnected);
  const hasRepos = repos.length > 0;

  // ── Sync from GitHub ─────────────────────────────────────────────────────
  async function handleSync() {
    setSyncing(true);
    setSyncError(null);
    try {
      await syncReposFromGitHub();
      const fresh = await listAllRepos();
      setRepos(fresh);
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : "Failed to sync repositories.",
      );
    } finally {
      setSyncing(false);
    }
  }

  // ── Connect / Disconnect ─────────────────────────────────────────────────
  async function handleToggle(repo: Repository) {
    setLoadingId(repo.id);
    setActionError(null);
    try {
      if (repo.isConnected) {
        await disconnectRepo({ data: { repoId: repo.id } });
        setRepos((prev) =>
          prev.map((r) =>
            r.id === repo.id ? { ...r, isConnected: false } : r,
          ),
        );
      } else {
        await connectRepo({ data: { repoId: repo.id } });
        setRepos((prev) =>
          prev.map((r) =>
            r.id === repo.id ? { ...r, isConnected: true } : r,
          ),
        );
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Action failed. Please try again.",
      );
    } finally {
      setLoadingId(null);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex w-full min-h-screen">
      <DashboardSidebar />

      <div
        className={cn(
          "flex-1 pt-24 pb-20 transition-all duration-300",
          isCollapsed ? "md:ml-20" : "md:ml-56",
        )}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1
                className="text-4xl font-bold text-foreground mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Repositories
              </h1>
              <p className="text-foreground/60 text-sm">
                Connect the repos you want Docunect to analyse. We only read
                config files — we never write to your code.
              </p>
            </div>

            {/* Sync button */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <RefreshCw
                className={cn("w-4 h-4", syncing && "animate-spin")}
              />
              {syncing ? "Syncing…" : "Sync from GitHub"}
            </button>
          </div>

          {/* Sync error */}
          {syncError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{syncError}</span>
            </div>
          )}

          {/* Action error */}
          {actionError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* ── Connected summary banner ──────────────────────────────────── */}
          {connected.length > 0 && (
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-sm text-foreground/80">
                <span className="font-semibold text-foreground">
                  {connected.length} repo{connected.length !== 1 ? "s" : ""}
                </span>{" "}
                connected.{" "}
                <Link
                  to="/dashboard"
                  className="text-primary font-medium hover:underline inline-flex items-center gap-1"
                >
                  Go to Analysis <ChevronRight className="w-3 h-3" />
                </Link>
              </p>
            </div>
          )}

          {/* ── Empty state — no repos synced yet ────────────────────────── */}
          {!hasRepos && !syncing && (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6 text-foreground/40" />
              </div>
              <h3
                className="text-lg font-semibold text-foreground mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                No repositories yet
              </h3>
              <p className="text-sm text-foreground/60 max-w-xs">
                Click{" "}
                <span className="font-medium text-foreground">
                  Sync from GitHub
                </span>{" "}
                above to pull in all the repos your GitHub account has access
                to.
              </p>
            </div>
          )}

          {/* ── Repo list ─────────────────────────────────────────────────── */}
          {hasRepos && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search repositories…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-foreground/50">
                <span>
                  {filtered.length} of {repos.length} repos
                </span>
                {connected.length > 0 && (
                  <span className="text-primary font-medium">
                    {connected.length} connected
                  </span>
                )}
              </div>

              {/* Repo cards */}
              <div className="space-y-2">
                {filtered.length === 0 && (
                  <div className="text-center py-10 text-sm text-foreground/50">
                    No repos match &ldquo;{search}&rdquo;
                  </div>
                )}

                {filtered.map((repo) => (
                  <RepoCard
                    key={repo.id}
                    repo={repo}
                    isLoading={loadingId === repo.id}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RepoCard
// ─────────────────────────────────────────────────────────────────────────────

interface RepoCardProps {
  repo: Repository;
  isLoading: boolean;
  onToggle: (repo: Repository) => void;
}

function RepoCard({ repo, isLoading, onToggle }: RepoCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all",
        repo.isConnected
          ? "bg-primary/5 border-primary/20"
          : "bg-background border-border hover:border-border/80 hover:bg-muted/20",
      )}
    >
      {/* Repo info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm text-foreground hover:underline truncate"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {repo.fullName}
          </a>

          {/* Visibility badge */}
          <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border text-foreground/50 border-border/60">
            {repo.isPrivate ? (
              <>
                <Lock className="w-2.5 h-2.5" /> Private
              </>
            ) : (
              <>
                <Globe className="w-2.5 h-2.5" /> Public
              </>
            )}
          </span>

          {/* Language */}
          {repo.language && (
            <span className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded border border-border/60 text-foreground/50">
              {repo.language}
            </span>
          )}

          {/* Connected badge */}
          {repo.isConnected && (
            <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              <CheckCircle className="w-2.5 h-2.5" /> Connected
            </span>
          )}
        </div>

        {repo.description && (
          <p className="text-xs text-foreground/50 mt-1 truncate">
            {repo.description}
          </p>
        )}

        {repo.lastAnalyzedAt && (
          <p className="text-[10px] text-foreground/40 mt-1">
            Last analysed{" "}
            {new Date(repo.lastAnalyzedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Action button */}
      <button
        onClick={() => onToggle(repo)}
        disabled={isLoading}
        className={cn(
          "flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
          repo.isConnected
            ? "bg-background border border-border text-foreground/70 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
            : "bg-foreground text-background hover:opacity-90",
        )}
      >
        {isLoading ? (
          <InlineSpinner />
        ) : repo.isConnected ? (
          <>
            <MinusCircle className="w-3.5 h-3.5" />
            Disconnect
          </>
        ) : (
          <>
            <PlusCircle className="w-3.5 h-3.5" />
            Connect
          </>
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tiny spinner
// ─────────────────────────────────────────────────────────────────────────────

function InlineSpinner() {
  return (
    <svg
      className="w-3.5 h-3.5 animate-spin"
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

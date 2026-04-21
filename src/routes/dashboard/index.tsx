// src/routes/dashboard/index.tsx
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { getCurrentUser } from "@/src/server/user";
import { listConnectedRepos } from "@/src/server/repos";
import { getLatestAnalysis, triggerAnalysis } from "@/src/server/analysis";
import type { Repository, Finding } from "@/src/db/schema";
import { DashboardSidebar } from "@/src/components/dashboard-sidebar";
import { useSidebar } from "@/src/components/sidebar-context";
import { cn } from "@/src/lib/utils";
import {
  Zap,
  RefreshCw,
  ChevronDown,
  GitBranch,
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type AnalysisWithFindings = Awaited<ReturnType<typeof getLatestAnalysis>>;

type TechEntry = {
  name: string;
  package: string;
  version: string;
  docsUrl: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Search params — repoId lets the user bookmark a specific repo's analysis
// ─────────────────────────────────────────────────────────────────────────────

type DashboardSearch = {
  repoId?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Route
// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/dashboard/")({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    repoId: typeof search.repoId === "string" ? search.repoId : undefined,
  }),

  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },

  loader: async ({ location }) => {
    const search = location.search as DashboardSearch;
    const connectedRepos = await listConnectedRepos();

    // Pick the active repo: prefer the one in the URL, fall back to the first
    const activeRepoId =
      search.repoId ??
      (connectedRepos.length > 0 ? connectedRepos[0].id : null);

    let latestAnalysis: AnalysisWithFindings = null;
    if (activeRepoId) {
      try {
        latestAnalysis = await getLatestAnalysis({
          data: { repositoryId: activeRepoId },
        });
      } catch {
        // No analysis yet — that's fine
      }
    }

    return { connectedRepos, activeRepoId, latestAnalysis };
  },

  component: DashboardPage,
});

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

function DashboardPage() {
  const {
    connectedRepos,
    activeRepoId,
    latestAnalysis: initialAnalysis,
  } = Route.useLoaderData();
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate({ from: "/dashboard/" });

  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(
    activeRepoId,
  );
  const [analysis, setAnalysis] =
    useState<AnalysisWithFindings>(initialAnalysis);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);

  const selectedRepo = connectedRepos.find((r) => r.id === selectedRepoId);

  // ── Switch repo ────────────────────────────────────────────────────────────
  async function handleSelectRepo(repo: Repository) {
    setRepoDropdownOpen(false);
    setSelectedRepoId(repo.id);
    setAnalysis(null);
    setRunError(null);

    // Update the URL so the selection is shareable / bookmarkable
    navigate({ search: (prev) => ({ ...prev, repoId: repo.id }) });

    try {
      const a = await getLatestAnalysis({ data: { repositoryId: repo.id } });
      setAnalysis(a);
    } catch {
      setAnalysis(null);
    }
  }

  // ── Run analysis ───────────────────────────────────────────────────────────
  async function handleRunAnalysis() {
    if (!selectedRepoId) return;
    setRunning(true);
    setRunError(null);

    try {
      await triggerAnalysis({ data: { repositoryId: selectedRepoId } });
      // Fetch the freshly-created analysis
      const fresh = await getLatestAnalysis({
        data: { repositoryId: selectedRepoId },
      });
      setAnalysis(fresh);
    } catch (err) {
      setRunError(
        err instanceof Error
          ? err.message.replace("Analysis failed: ", "")
          : "Analysis failed. Please try again.",
      );
    } finally {
      setRunning(false);
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const findings = analysis?.findings ?? [];
  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  const infos = findings.filter((f) => f.severity === "info");
  const techStack = (analysis?.techStack ?? []) as TechEntry[];
  const isCompleted = analysis?.status === "completed";
  const isFailed = analysis?.status === "failed";

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1
                className="text-4xl font-bold text-foreground mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Code Analysis
              </h1>
              <p className="text-foreground/60 text-sm">
                AI analysis backed exclusively by official documentation — no
                training data used.
              </p>
            </div>

            {/* Run analysis button */}
            {selectedRepo && (
              <button
                onClick={handleRunAnalysis}
                disabled={running || connectedRepos.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analysing…
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    {isCompleted ? "Re-run Analysis" : "Run Analysis"}
                  </>
                )}
              </button>
            )}
          </div>

          {/* ── No connected repos ──────────────────────────────────────────── */}
          {connectedRepos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-2xl">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <GitBranch className="w-7 h-7 text-foreground/30" />
              </div>
              <h3
                className="text-xl font-semibold text-foreground mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                No repositories connected
              </h3>
              <p className="text-sm text-foreground/60 mb-6 max-w-xs">
                Connect at least one GitHub repository to run your first
                documentation-backed analysis.
              </p>
              <Link
                to="/dashboard/repositories"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <GitBranch className="w-4 h-4" />
                Connect a repository
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* ── Repo picker ─────────────────────────────────────────────────── */}
          {connectedRepos.length > 0 && (
            <div className="relative w-full max-w-xs">
              <button
                onClick={() => setRepoDropdownOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors text-sm font-medium text-foreground"
              >
                <span className="flex items-center gap-2 truncate">
                  <GitBranch className="w-4 h-4 text-foreground/50 flex-shrink-0" />
                  <span className="truncate">
                    {selectedRepo?.name ?? "Select a repository"}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-foreground/50 transition-transform flex-shrink-0",
                    repoDropdownOpen && "rotate-180",
                  )}
                />
              </button>

              {repoDropdownOpen && (
                <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-background border border-border rounded-xl shadow-lg py-1 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                  {connectedRepos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => handleSelectRepo(repo)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors",
                        repo.id === selectedRepoId &&
                          "bg-primary/5 text-primary font-medium",
                      )}
                    >
                      <GitBranch className="w-4 h-4 flex-shrink-0 opacity-60" />
                      <span className="truncate">{repo.fullName}</span>
                      {repo.id === selectedRepoId && (
                        <CheckCircle className="w-3.5 h-3.5 ml-auto flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Run error ───────────────────────────────────────────────────── */}
          {runError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-0.5">Analysis failed</p>
                <p className="text-red-600/80">{runError}</p>
              </div>
            </div>
          )}

          {/* ── Running state ────────────────────────────────────────────────── */}
          {running && (
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
                <div>
                  <h3
                    className="font-semibold text-foreground mb-1"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Analysis in progress
                  </h3>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    Fetching official documentation for your tech stack and
                    running Gemini analysis. This usually takes{" "}
                    <span className="font-medium">15–45 seconds</span>.
                  </p>
                  <div className="mt-3 space-y-1.5 text-xs text-foreground/50">
                    <ProgressStep
                      label="Reading package.json from GitHub"
                      done
                    />
                    <ProgressStep label="Detecting tech stack" done />
                    <ProgressStep
                      label="Fetching official documentation"
                      active
                    />
                    <ProgressStep label="Running Gemini analysis" />
                    <ProgressStep label="Saving results" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── No analysis yet ──────────────────────────────────────────────── */}
          {!running && selectedRepo && !analysis && !runError && (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Zap className="w-7 h-7 text-foreground/30" />
              </div>
              <h3
                className="text-xl font-semibold text-foreground mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                No analysis yet
              </h3>
              <p className="text-sm text-foreground/60 mb-6 max-w-xs">
                Click{" "}
                <span className="font-medium text-foreground">
                  Run Analysis
                </span>{" "}
                above to analyse{" "}
                <span className="font-medium text-foreground">
                  {selectedRepo.name}
                </span>{" "}
                against its official documentation.
              </p>
            </div>
          )}

          {/* ── Failed analysis ────────────────────────────────────────────── */}
          {!running && isFailed && analysis && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-0.5">Previous analysis failed</p>
                <p className="text-red-600/80">
                  {analysis.errorMessage ?? "Unknown error. Try re-running."}
                </p>
              </div>
            </div>
          )}

          {/* ── Analysis results ──────────────────────────────────────────────
               Only shown when status = 'completed'
          ─────────────────────────────────────────────────────────────────── */}
          {!running && isCompleted && analysis && (
            <>
              {/* Summary + meta */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-lg">✨</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                      <h3
                        className="font-semibold text-foreground"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        AI Analysis Summary
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-foreground/40">
                        <Clock className="w-3 h-3" />
                        {new Date(analysis.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {analysis.summary}
                    </p>

                    {/* Counts */}
                    <div className="mt-4 flex items-center gap-4 text-sm flex-wrap">
                      <Chip
                        color="red"
                        value={analysis.errorCount}
                        label="error"
                      />
                      <Chip
                        color="yellow"
                        value={analysis.warningCount}
                        label="warning"
                      />
                      <Chip
                        color="blue"
                        value={analysis.infoCount}
                        label="suggestion"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Kanban board */}
              {findings.length > 0 ? (
                <div className="space-y-4">
                  <h2
                    className="text-xl font-semibold text-foreground"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Issues &amp; Suggestions
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FindingsColumn
                      title="Errors"
                      color="red"
                      findings={errors}
                    />
                    <FindingsColumn
                      title="Warnings"
                      color="yellow"
                      findings={warnings}
                    />
                    <FindingsColumn
                      title="Suggestions"
                      color="blue"
                      findings={infos}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-green-200 rounded-2xl bg-green-50/50">
                  <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
                  <h3
                    className="text-lg font-semibold text-foreground mb-1"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    All clear
                  </h3>
                  <p className="text-sm text-foreground/60">
                    No issues found in the official documentation for your
                    current tech stack.
                  </p>
                </div>
              )}

              {/* Tech stack */}
              {techStack.length > 0 && (
                <div className="bg-muted/30 border border-border rounded-xl p-6 space-y-4">
                  <h2
                    className="text-xl font-semibold text-foreground"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Tech Stack Analysed
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {techStack.map((tech) => (
                      <a
                        key={tech.package}
                        href={tech.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 p-3 rounded-lg bg-background border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                      >
                        <div className="min-w-0">
                          <p
                            className="text-sm font-semibold text-foreground truncate"
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            {tech.name}
                          </p>
                          <p className="text-xs font-mono text-foreground/40 truncate">
                            {tech.package}@{tech.version}
                          </p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FindingsColumn
// ─────────────────────────────────────────────────────────────────────────────

const colorMap = {
  red: {
    column: "border-red-200/30 bg-red-500/5",
    header: "border-red-200/40",
    dot: "bg-red-500",
    title: "text-red-700",
    badge: "bg-red-500/10 text-red-600",
    card: "border-red-200/50 hover:shadow-red-100",
    suggestion: "bg-red-50 border-red-100 text-red-700",
  },
  yellow: {
    column: "border-yellow-200/30 bg-yellow-500/5",
    header: "border-yellow-200/40",
    dot: "bg-yellow-500",
    title: "text-yellow-700",
    badge: "bg-yellow-500/10 text-yellow-600",
    card: "border-yellow-200/50 hover:shadow-yellow-100",
    suggestion: "bg-yellow-50 border-yellow-100 text-yellow-700",
  },
  blue: {
    column: "border-blue-200/30 bg-blue-500/5",
    header: "border-blue-200/40",
    dot: "bg-blue-500",
    title: "text-blue-700",
    badge: "bg-blue-500/10 text-blue-600",
    card: "border-blue-200/50 hover:shadow-blue-100",
    suggestion: "bg-blue-50 border-blue-100 text-blue-700",
  },
};

function FindingsColumn({
  title,
  color,
  findings,
}: {
  title: string;
  color: "red" | "yellow" | "blue";
  findings: Finding[];
}) {
  const c = colorMap[color];

  return (
    <div className={cn("border rounded-xl p-4", c.column)}>
      {/* Column header */}
      <div
        className={cn("flex items-center gap-2 mb-4 pb-3 border-b", c.header)}
      >
        <div className={cn("w-3 h-3 rounded-full", c.dot)} />
        <h3
          className={cn("font-semibold text-sm", c.title)}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h3>
        <span
          className={cn(
            "ml-auto text-xs font-bold px-2 py-0.5 rounded",
            c.badge,
          )}
        >
          {findings.length}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {findings.length === 0 && (
          <p className="text-xs text-foreground/40 text-center py-4">
            None found
          </p>
        )}
        {findings.map((f) => (
          <FindingCard key={f.id} finding={f} colors={c} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FindingCard
// ─────────────────────────────────────────────────────────────────────────────

function FindingCard({
  finding,
  colors,
}: {
  finding: Finding;
  colors: (typeof colorMap)["red"];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "bg-background border rounded-lg p-3 transition-shadow hover:shadow-md cursor-default",
        colors.card,
      )}
    >
      <h4 className="font-semibold text-sm text-foreground mb-1 leading-snug">
        {finding.title}
      </h4>

      <p className="text-xs text-foreground/70 mb-2 leading-relaxed">
        {finding.description}
      </p>

      {finding.file && (
        <div className="text-[10px] font-mono text-foreground/40 mb-2 truncate">
          {finding.file}
          {finding.line != null && `:${finding.line}`}
        </div>
      )}

      {finding.suggestion && (
        <div
          className={cn(
            "text-xs border rounded p-2 mb-2 leading-relaxed",
            colors.suggestion,
          )}
        >
          <span className="font-semibold">💡 </span>
          {finding.suggestion}
        </div>
      )}

      {/* Doc source link — this proves the AI used docs, not training data */}
      <a
        href={finding.docSource}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[10px] text-foreground/40 hover:text-primary transition-colors"
      >
        <ExternalLink className="w-2.5 h-2.5" />
        Source: {new URL(finding.docSource).hostname}
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small helper components
// ─────────────────────────────────────────────────────────────────────────────

function Chip({
  color,
  value,
  label,
}: {
  color: "red" | "yellow" | "blue";
  value: number;
  label: string;
}) {
  const styles = {
    red: "bg-red-500/10 text-red-700",
    yellow: "bg-yellow-500/10 text-yellow-700",
    blue: "bg-blue-500/10 text-blue-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        styles[color],
      )}
    >
      <span className="font-bold text-sm">{value}</span>
      {label}
      {value !== 1 ? "s" : ""}
    </span>
  );
}

function ProgressStep({
  label,
  done,
  active,
}: {
  label: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
      ) : active ? (
        <Loader2 className="w-3 h-3 text-primary animate-spin flex-shrink-0" />
      ) : (
        <div className="w-3 h-3 rounded-full border border-foreground/20 flex-shrink-0" />
      )}
      <span
        className={cn(
          done
            ? "text-green-600"
            : active
              ? "text-primary font-medium"
              : "text-foreground/30",
        )}
      >
        {label}
      </span>
    </div>
  );
}

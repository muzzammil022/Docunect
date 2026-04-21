// src/server/analysis.ts
import { createServerFn } from "@tanstack/react-start";
import { eq, desc } from "drizzle-orm";
import { db } from "@/src/db";
import { analyses, findings, repositories } from "@/src/db/schema";
import type { NewAnalysis, NewFinding } from "@/src/db/schema";
import { requireAuth } from "./user";
import { getGitHubAccessToken, getRepoSnapshot } from "@/src/lib/github";
import { analyzeRepository } from "@/src/lib/gemini";

// ─────────────────────────────────────────────────────────────────────────────
// triggerAnalysis
// Full pipeline:
//   1. Auth check
//   2. Verify repo belongs to user
//   3. Fetch package.json + config files from GitHub
//   4. Detect tech stack → fetch docs → call Gemini
//   5. Persist analysis + findings to Neon
//   6. Return the analysis id so the client can poll / navigate
// ─────────────────────────────────────────────────────────────────────────────

export const triggerAnalysis = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (
      !data ||
      typeof data !== "object" ||
      !("repositoryId" in data) ||
      typeof (data as { repositoryId: unknown }).repositoryId !== "string"
    ) {
      throw new Error("repositoryId (string) is required");
    }
    return data as { repositoryId: string };
  })
  .handler(async ({ data }) => {
    const { user } = await requireAuth();

    // ── 1. Fetch the repository row (must belong to this user) ───────────────
    const repoRows = await db
      .select()
      .from(repositories)
      .where(eq(repositories.id, data.repositoryId))
      .limit(1);

    const repo = repoRows[0];

    if (!repo) {
      throw new Error("Repository not found");
    }

    if (repo.userId !== user.id) {
      throw new Error("UNAUTHORIZED");
    }

    if (!repo.isConnected) {
      throw new Error(
        "Repository is not connected. Connect it first before running analysis.",
      );
    }

    // ── 2. Create a "pending" analysis row immediately ───────────────────────
    //    This lets the UI show a loading state while the work runs.
    const [newAnalysis] = await db
      .insert(analyses)
      .values({
        repositoryId: repo.id,
        userId: user.id,
        status: "pending",
      } satisfies NewAnalysis)
      .returning();

    // ── 3. Get the GitHub access token for API calls ─────────────────────────
    const accessToken = await getGitHubAccessToken(user.id);

    if (!accessToken) {
      await db
        .update(analyses)
        .set({
          status: "failed",
          errorMessage:
            "No GitHub access token found. Please re-authenticate with GitHub.",
          updatedAt: new Date(),
        })
        .where(eq(analyses.id, newAnalysis.id));

      throw new Error(
        "No GitHub access token found. Please re-authenticate with GitHub.",
      );
    }

    try {
      // ── 4. Mark as running ─────────────────────────────────────────────────
      await db
        .update(analyses)
        .set({ status: "running", updatedAt: new Date() })
        .where(eq(analyses.id, newAnalysis.id));

      // ── 5. Fetch repo snapshot from GitHub ─────────────────────────────────
      const snapshot = await getRepoSnapshot(accessToken, repo.fullName);

      // ── 6. Run Gemini analysis (docs-only) ─────────────────────────────────
      const result = await analyzeRepository(snapshot);

      // ── 7. Compute aggregated counts ───────────────────────────────────────
      const errorCount = result.findings.filter(
        (f) => f.severity === "error",
      ).length;
      const warningCount = result.findings.filter(
        (f) => f.severity === "warning",
      ).length;
      const infoCount = result.findings.filter(
        (f) => f.severity === "info",
      ).length;
      const totalIssues = errorCount + warningCount + infoCount;

      // ── 8. Persist the completed analysis ─────────────────────────────────
      await db
        .update(analyses)
        .set({
          status: "completed",
          summary: result.summary,
          techStack: result.techStack,
          totalIssues,
          errorCount,
          warningCount,
          infoCount,
          updatedAt: new Date(),
        })
        .where(eq(analyses.id, newAnalysis.id));

      // ── 9. Persist findings (batch insert) ─────────────────────────────────
      if (result.findings.length > 0) {
        const findingRows: NewFinding[] = result.findings.map((f) => ({
          analysisId: newAnalysis.id,
          severity: f.severity,
          title: f.title,
          description: f.description,
          file: f.file ?? null,
          line: null,
          suggestion: f.suggestion,
          docSource: f.docSource,
        }));

        await db.insert(findings).values(findingRows);
      }

      // ── 10. Update repo's lastAnalyzedAt ───────────────────────────────────
      await db
        .update(repositories)
        .set({ lastAnalyzedAt: new Date(), updatedAt: new Date() })
        .where(eq(repositories.id, repo.id));

      return {
        analysisId: newAnalysis.id,
        status: "completed" as const,
        totalIssues,
        errorCount,
        warningCount,
        infoCount,
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error during analysis";

      await db
        .update(analyses)
        .set({
          status: "failed",
          errorMessage: message,
          updatedAt: new Date(),
        })
        .where(eq(analyses.id, newAnalysis.id));

      throw new Error(`Analysis failed: ${message}`);
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// getAnalysisById
// Returns a full analysis with its findings, verified to belong to the caller.
// ─────────────────────────────────────────────────────────────────────────────

export const getAnalysisById = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    if (
      !data ||
      typeof data !== "object" ||
      !("analysisId" in data) ||
      typeof (data as { analysisId: unknown }).analysisId !== "string"
    ) {
      throw new Error("analysisId (string) is required");
    }
    return data as { analysisId: string };
  })
  .handler(async ({ data }) => {
    const { user } = await requireAuth();

    const analysisRows = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, data.analysisId))
      .limit(1);

    const analysis = analysisRows[0];

    if (!analysis) throw new Error("Analysis not found");
    if (analysis.userId !== user.id) throw new Error("UNAUTHORIZED");

    const findingRows = await db
      .select()
      .from(findings)
      .where(eq(findings.analysisId, analysis.id))
      .orderBy(findings.createdAt);

    return {
      ...analysis,
      findings: findingRows,
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// getLatestAnalysis
// Returns the most recent completed analysis for a given repository,
// including all findings. Returns null if none exist yet.
// ─────────────────────────────────────────────────────────────────────────────

export const getLatestAnalysis = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    if (
      !data ||
      typeof data !== "object" ||
      !("repositoryId" in data) ||
      typeof (data as { repositoryId: unknown }).repositoryId !== "string"
    ) {
      throw new Error("repositoryId (string) is required");
    }
    return data as { repositoryId: string };
  })
  .handler(async ({ data }) => {
    const { user } = await requireAuth();

    // Verify the repo belongs to this user
    const repoRows = await db
      .select({ userId: repositories.userId })
      .from(repositories)
      .where(eq(repositories.id, data.repositoryId))
      .limit(1);

    const repo = repoRows[0];
    if (!repo) throw new Error("Repository not found");
    if (repo.userId !== user.id) throw new Error("UNAUTHORIZED");

    // Get the latest completed analysis
    const analysisRows = await db
      .select()
      .from(analyses)
      .where(eq(analyses.repositoryId, data.repositoryId))
      .orderBy(desc(analyses.createdAt))
      .limit(1);

    const analysis = analysisRows[0];
    if (!analysis) return null;

    const findingRows = await db
      .select()
      .from(findings)
      .where(eq(findings.analysisId, analysis.id))
      .orderBy(findings.severity, findings.createdAt);

    return {
      ...analysis,
      findings: findingRows,
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// listAnalyses
// Returns all analyses for a repository (latest first), without findings.
// Useful for showing an analysis history timeline.
// ─────────────────────────────────────────────────────────────────────────────

export const listAnalyses = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    if (
      !data ||
      typeof data !== "object" ||
      !("repositoryId" in data) ||
      typeof (data as { repositoryId: unknown }).repositoryId !== "string"
    ) {
      throw new Error("repositoryId (string) is required");
    }
    return data as { repositoryId: string };
  })
  .handler(async ({ data }) => {
    const { user } = await requireAuth();

    // Verify ownership
    const repoRows = await db
      .select({ userId: repositories.userId })
      .from(repositories)
      .where(eq(repositories.id, data.repositoryId))
      .limit(1);

    const repo = repoRows[0];
    if (!repo) throw new Error("Repository not found");
    if (repo.userId !== user.id) throw new Error("UNAUTHORIZED");

    const rows = await db
      .select()
      .from(analyses)
      .where(eq(analyses.repositoryId, data.repositoryId))
      .orderBy(desc(analyses.createdAt));

    return rows;
  });

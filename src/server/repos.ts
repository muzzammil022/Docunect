// src/server/repos.ts
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/src/db";
import { repositories } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "./user";
import {
  getGitHubAccessToken,
  listUserRepos,
  getRepoSnapshot,
} from "@/src/lib/github";

// ─────────────────────────────────────────────────────────────────────────────
// SYNC  —  pull all repos from GitHub and upsert into our DB
// The user has already granted us the "repo" scope during GitHub OAuth,
// so we can see both public and private repos they own or collaborate on.
// This mirrors the Vercel "Import Git Repository" flow.
// ─────────────────────────────────────────────────────────────────────────────

export const syncReposFromGitHub = createServerFn({ method: "POST" }).handler(
  async () => {
    const { user } = await requireAuth();

    const accessToken = await getGitHubAccessToken(user.id);
    if (!accessToken) {
      throw new Error(
        "No GitHub access token found. Please sign out and sign in again with GitHub.",
      );
    }

    const githubRepos = await listUserRepos(accessToken);

    if (githubRepos.length === 0) {
      return { synced: 0, total: 0 };
    }

    // Upsert every repo we fetched.
    // We use ON CONFLICT (github_id, user_id) to update metadata without
    // touching the user's isConnected choice.
    for (const repo of githubRepos) {
      await db
        .insert(repositories)
        .values({
          userId: user.id,
          githubId: repo.githubId,
          name: repo.name,
          fullName: repo.fullName,
          description: repo.description,
          isPrivate: repo.isPrivate,
          defaultBranch: repo.defaultBranch,
          language: repo.language,
          url: repo.url,
          isConnected: false,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          // If we already have this repo, refresh metadata but keep isConnected as-is
          target: [repositories.githubId, repositories.userId],
          set: {
            name: repo.name,
            fullName: repo.fullName,
            description: repo.description,
            isPrivate: repo.isPrivate,
            defaultBranch: repo.defaultBranch,
            language: repo.language,
            url: repo.url,
            updatedAt: new Date(),
          },
        });
    }

    return { synced: githubRepos.length, total: githubRepos.length };
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// LIST ALL  —  every repo we have stored for this user (connected + not)
// The dashboard uses this to show the Vercel-style repo picker.
// ─────────────────────────────────────────────────────────────────────────────

export const listAllRepos = createServerFn({ method: "GET" }).handler(
  async () => {
    const { user } = await requireAuth();

    const rows = await db
      .select()
      .from(repositories)
      .where(eq(repositories.userId, user.id))
      .orderBy(repositories.updatedAt);

    return rows;
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// LIST CONNECTED  —  only repos the user has explicitly connected
// Shown in the sidebar and on the Analysis page.
// ─────────────────────────────────────────────────────────────────────────────

export const listConnectedRepos = createServerFn({ method: "GET" }).handler(
  async () => {
    const { user } = await requireAuth();

    const rows = await db
      .select()
      .from(repositories)
      .where(
        and(
          eq(repositories.userId, user.id),
          eq(repositories.isConnected, true),
        ),
      )
      .orderBy(repositories.updatedAt);

    return rows;
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// CONNECT  —  user picks a repo to analyse (like clicking "Import" in Vercel)
// ─────────────────────────────────────────────────────────────────────────────

export const connectRepo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (
      typeof data !== "object" ||
      data === null ||
      typeof (data as Record<string, unknown>).repoId !== "string"
    ) {
      throw new Error("repoId must be a non-empty string");
    }
    return { repoId: (data as Record<string, unknown>).repoId as string };
  })
  .handler(async ({ data }) => {
    const { user } = await requireAuth();

    // Verify this repo belongs to the signed-in user before touching it
    const existing = await db
      .select({ id: repositories.id, userId: repositories.userId })
      .from(repositories)
      .where(
        and(eq(repositories.id, data.repoId), eq(repositories.userId, user.id)),
      )
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Repository not found or does not belong to you.");
    }

    await db
      .update(repositories)
      .set({ isConnected: true, updatedAt: new Date() })
      .where(eq(repositories.id, data.repoId));

    return { success: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// DISCONNECT  —  user removes a repo from their Docunect workspace
// ─────────────────────────────────────────────────────────────────────────────

export const disconnectRepo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (
      typeof data !== "object" ||
      data === null ||
      typeof (data as Record<string, unknown>).repoId !== "string"
    ) {
      throw new Error("repoId must be a non-empty string");
    }
    return { repoId: (data as Record<string, unknown>).repoId as string };
  })
  .handler(async ({ data }) => {
    const { user } = await requireAuth();

    const existing = await db
      .select({ id: repositories.id, userId: repositories.userId })
      .from(repositories)
      .where(
        and(eq(repositories.id, data.repoId), eq(repositories.userId, user.id)),
      )
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Repository not found or does not belong to you.");
    }

    await db
      .update(repositories)
      .set({ isConnected: false, updatedAt: new Date() })
      .where(eq(repositories.id, data.repoId));

    return { success: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// GET ONE  —  fetch a single repo by its DB id
// Used by the analysis page to show repo metadata.
// ─────────────────────────────────────────────────────────────────────────────

export const getRepo = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    if (
      typeof data !== "object" ||
      data === null ||
      typeof (data as Record<string, unknown>).repoId !== "string"
    ) {
      throw new Error("repoId must be a non-empty string");
    }
    return { repoId: (data as Record<string, unknown>).repoId as string };
  })
  .handler(async ({ data }) => {
    const { user } = await requireAuth();

    const rows = await db
      .select()
      .from(repositories)
      .where(
        and(eq(repositories.id, data.repoId), eq(repositories.userId, user.id)),
      )
      .limit(1);

    if (rows.length === 0) {
      throw new Error("Repository not found.");
    }

    return rows[0];
  });

// ─────────────────────────────────────────────────────────────────────────────
// GET SNAPSHOT  —  fetch the actual file contents from GitHub for a repo
// Used internally by the analysis engine and exposed here for the UI to
// show "what files we scanned".
// ─────────────────────────────────────────────────────────────────────────────

export const getRepoSnapshotFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    if (
      typeof data !== "object" ||
      data === null ||
      typeof (data as Record<string, unknown>).repoId !== "string"
    ) {
      throw new Error("repoId must be a non-empty string");
    }
    return { repoId: (data as Record<string, unknown>).repoId as string };
  })
  .handler(async ({ data }) => {
    const { user } = await requireAuth();

    // Load the repo row to get the fullName ("owner/repo")
    const rows = await db
      .select()
      .from(repositories)
      .where(
        and(eq(repositories.id, data.repoId), eq(repositories.userId, user.id)),
      )
      .limit(1);

    if (rows.length === 0) {
      throw new Error("Repository not found.");
    }

    const repo = rows[0];

    const accessToken = await getGitHubAccessToken(user.id);
    if (!accessToken) {
      throw new Error("No GitHub access token. Please re-authenticate.");
    }

    const snapshot = await getRepoSnapshot(accessToken, repo.fullName);

    return {
      repoId: repo.id,
      fullName: repo.fullName,
      packageJson: snapshot.packageJson,
      tsConfig: snapshot.tsConfig,
      buildConfig: snapshot.buildConfig,
      envExample: snapshot.envExample,
    };
  });

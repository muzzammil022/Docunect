// src/db/schema.ts
import {
  pgTable,
  text,
  boolean,
  timestamp,
  uuid,
  integer,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// BETTER AUTH TABLES
// These four tables are required by better-auth (usePlural: true)
// Column JS property names MUST match what better-auth expects (camelCase)
// ─────────────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sessions_token_idx").on(t.token)],
);

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  // OAuth tokens — we read the access token to call GitHub API
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  // For credential-based accounts (not used, but better-auth expects the column)
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// APP TABLES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * repositories
 * One row per GitHub repo the user has imported.
 * isConnected = true means the user picked this repo for analysis (like Vercel).
 */
export const repositories = pgTable(
  "repositories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // GitHub metadata
    githubId: integer("github_id").notNull(), // GitHub's numeric repo id
    name: text("name").notNull(), // "my-app"
    fullName: text("full_name").notNull(), // "owner/my-app"
    description: text("description"),
    isPrivate: boolean("is_private").notNull().default(false),
    defaultBranch: text("default_branch").notNull().default("main"),
    language: text("language"), // primary language reported by GitHub
    url: text("url").notNull(), // https://github.com/owner/my-app

    // App state
    isConnected: boolean("is_connected").notNull().default(false),
    lastAnalyzedAt: timestamp("last_analyzed_at"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    // Required for the ON CONFLICT DO UPDATE (upsert) in syncReposFromGitHub.
    // A user can only have one row per GitHub repo id.
    uniqueIndex("repositories_github_user_idx").on(t.githubId, t.userId),
  ],
);

/**
 * analyses
 * One analysis run per repository.
 * A single repository can have many analyses over time.
 * status flow: pending → running → completed | failed
 */
export const analyses = pgTable("analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  repositoryId: uuid("repository_id")
    .notNull()
    .references(() => repositories.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // State
  status: text("status", {
    enum: ["pending", "running", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  errorMessage: text("error_message"), // populated when status = 'failed'

  // Gemini output — stored as a text summary + structured JSON
  summary: text("summary"),
  techStack: jsonb("tech_stack").$type<
    Array<{
      name: string;
      package: string;
      version: string;
      docsUrl: string;
    }>
  >(), // Array<{ name, package, version, docsUrl }>

  // Aggregated counts (denormalised for quick display)
  totalIssues: integer("total_issues").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  warningCount: integer("warning_count").notNull().default(0),
  infoCount: integer("info_count").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * findings
 * Each row is one issue / suggestion returned by Gemini.
 * docSource is the exact documentation URL Gemini used as evidence — this
 * enforces the "no training data" contract at the data level.
 */
export const findings = pgTable("findings", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id")
    .notNull()
    .references(() => analyses.id, { onDelete: "cascade" }),

  severity: text("severity", {
    enum: ["error", "warning", "info"],
  }).notNull(),

  title: text("title").notNull(),
  description: text("description").notNull(),

  // Optional location inside the repo
  file: text("file"),
  line: integer("line"),

  suggestion: text("suggestion"),

  // The documentation URL that backs this finding — REQUIRED by the AI engine
  docSource: text("doc_source").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONS  (for Drizzle relational queries)
// ─────────────────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  repositories: many(repositories),
  analyses: many(analyses),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const repositoriesRelations = relations(
  repositories,
  ({ one, many }) => ({
    user: one(users, { fields: [repositories.userId], references: [users.id] }),
    analyses: many(analyses),
  }),
);

export const analysesRelations = relations(analyses, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [analyses.repositoryId],
    references: [repositories.id],
  }),
  user: one(users, { fields: [analyses.userId], references: [users.id] }),
  findings: many(findings),
}));

export const findingsRelations = relations(findings, ({ one }) => ({
  analysis: one(analyses, {
    fields: [findings.analysisId],
    references: [analyses.id],
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// TYPES  (inferred from the schema for use in server functions)
// ─────────────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;
export type Analysis = typeof analyses.$inferSelect;
export type NewAnalysis = typeof analyses.$inferInsert;
export type Finding = typeof findings.$inferSelect;
export type NewFinding = typeof findings.$inferInsert;

export type AnalysisStatus = "pending" | "running" | "completed" | "failed";
export type FindingSeverity = "error" | "warning" | "info";

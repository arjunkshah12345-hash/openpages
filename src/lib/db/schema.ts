import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const spaces = sqliteTable("spaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("◇"),
  description: text("description").default(""),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  settings: text("settings", { mode: "json" }).$type<Record<string, unknown>>().default({}),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const spaceMembers = sqliteTable(
  "space_members",
  {
    id: text("id").primaryKey(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    role: text("role", { enum: ["owner", "editor", "viewer"] })
      .notNull()
      .default("editor"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("space_members_space_idx").on(t.spaceId)]
);

export const pages = sqliteTable(
  "pages",
  {
    id: text("id").primaryKey(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Untitled"),
    icon: text("icon").default("📄"),
    content: text("content", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .default({ type: "doc", content: [{ type: "paragraph" }] }),
    contentText: text("content_text").notNull().default(""),
    parentId: text("parent_id"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdBy: text("created_by").notNull().default("user"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index("pages_space_idx").on(t.spaceId),
    index("pages_text_idx").on(t.contentText),
  ]
);

export const pageVersions = sqliteTable(
  "page_versions",
  {
    id: text("id").primaryKey(),
    pageId: text("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
    contentText: text("content_text").notNull().default(""),
    actorType: text("actor_type", {
      enum: ["user", "agent", "mcp"],
    })
      .notNull()
      .default("user"),
    actorId: text("actor_id"),
    summary: text("summary"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("page_versions_page_idx").on(t.pageId)]
);

export const files = sqliteTable(
  "files",
  {
    id: text("id").primaryKey(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    mimeType: text("mime_type").notNull().default("text/plain"),
    size: integer("size").notNull().default(0),
    contentText: text("content_text").default(""),
    storagePath: text("storage_path"),
    createdBy: text("created_by").notNull().default("user"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("files_space_idx").on(t.spaceId)]
);

export const pageLinks = sqliteTable("page_links", {
  id: text("id").primaryKey(),
  spaceId: text("space_id")
    .notNull()
    .references(() => spaces.id, { onDelete: "cascade" }),
  fromPageId: text("from_page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  toPageId: text("to_page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  label: text("label"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const conversations = sqliteTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New chat"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("conversations_space_idx").on(t.spaceId)]
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
    content: text("content").notNull(),
    model: text("model"),
    contextMeta: text("context_meta", { mode: "json" }).$type<ContextMeta | null>(),
    citations: text("citations", { mode: "json" }).$type<Citation[]>().default([]),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId)]
);

export const agentRuns = sqliteTable(
  "agent_runs",
  {
    id: text("id").primaryKey(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    goal: text("goal").notNull(),
    status: text("status", {
      enum: ["pending", "running", "completed", "failed"],
    })
      .notNull()
      .default("pending"),
    steps: text("steps", { mode: "json" }).$type<AgentStep[]>().default([]),
    contextMeta: text("context_meta", { mode: "json" }).$type<ContextMeta | null>(),
    result: text("result"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("agent_runs_space_idx").on(t.spaceId)]
);

export type Citation = {
  type: "page" | "file";
  id: string;
  title: string;
};

export type ContextMeta = {
  sources: Citation[];
  originalTokens: number;
  compressedTokens: number;
  tokensSavedPct: number;
  originalContext: string;
  compressedContext: string;
  mode?: string;
  /** `api` | `local` — SuperCompress hosted vs offline stand-in */
  provider?: string;
  policyName?: string;
};

export type AgentStep = {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
  at: number;
};

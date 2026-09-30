import { sql } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import type { AgentStep, Citation, ContextMeta } from "./schema";

/**
 * Neon / Postgres tables live in schema `openpages`
 * so they never collide with other apps on a shared database.
 */
export const openpages = pgSchema("openpages");

export const users = openpages.table("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const spaces = openpages.table("spaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("◇"),
  description: text("description").default(""),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  settings: jsonb("settings").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const spaceMembers = openpages.table(
  "space_members",
  {
    id: text("id").primaryKey(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    role: text("role").notNull().default("editor"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("space_members_space_idx").on(t.spaceId)]
);

export const pages = openpages.table(
  "pages",
  {
    id: text("id").primaryKey(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Untitled"),
    icon: text("icon").default("📄"),
    content: jsonb("content")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({ type: "doc", content: [{ type: "paragraph" }] }),
    contentText: text("content_text").notNull().default(""),
    parentId: text("parent_id"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdBy: text("created_by").notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("pages_space_idx").on(t.spaceId)]
);

export const pageVersions = openpages.table(
  "page_versions",
  {
    id: text("id").primaryKey(),
    pageId: text("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: jsonb("content").$type<Record<string, unknown>>().notNull(),
    contentText: text("content_text").notNull().default(""),
    actorType: text("actor_type").notNull().default("user"),
    actorId: text("actor_id"),
    summary: text("summary"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("page_versions_page_idx").on(t.pageId)]
);

export const files = openpages.table(
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
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("files_space_idx").on(t.spaceId)]
);

export const pageLinks = openpages.table("page_links", {
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
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const conversations = openpages.table(
  "conversations",
  {
    id: text("id").primaryKey(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New chat"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("conversations_space_idx").on(t.spaceId)]
);

export const messages = openpages.table(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    model: text("model"),
    contextMeta: jsonb("context_meta").$type<ContextMeta | null>(),
    citations: jsonb("citations").$type<Citation[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId)]
);

export const agentRuns = openpages.table(
  "agent_runs",
  {
    id: text("id").primaryKey(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    goal: text("goal").notNull(),
    status: text("status").notNull().default("pending"),
    steps: jsonb("steps").$type<AgentStep[]>().default([]),
    contextMeta: jsonb("context_meta").$type<ContextMeta | null>(),
    result: text("result"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [index("agent_runs_space_idx").on(t.spaceId)]
);

void sql;

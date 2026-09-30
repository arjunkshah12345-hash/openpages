import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./pg-schema";
import { APP } from "@/lib/config";

export function isPostgresUrl(url?: string | null): boolean {
  if (!url) return false;
  const cleaned = url.trim().replace(/^["']|["']$/g, "");
  return (
    cleaned.startsWith("postgres://") || cleaned.startsWith("postgresql://")
  );
}

export function getPostgresUrl(): string | null {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.POSTGRES_URL_NON_POOLING,
  ];
  for (const c of candidates) {
    if (!c) continue;
    const cleaned = c.trim().replace(/^["']|["']$/g, "");
    if (isPostgresUrl(cleaned)) return cleaned;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sql = any;
type PgDb = ReturnType<typeof drizzle<typeof schema>>;

let pgInstance: PgDb | null = null;
let migrated = false;

async function migratePg(sql: Sql) {
  // Dedicated schema so we never collide with other apps on a shared Neon DB
  await sql`CREATE SCHEMA IF NOT EXISTS openpages`;

  await sql`
    CREATE TABLE IF NOT EXISTS openpages.users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS openpages.spaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '◇',
      description TEXT DEFAULT '',
      owner_id TEXT NOT NULL REFERENCES openpages.users(id),
      settings JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS openpages.space_members (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL REFERENCES openpages.spaces(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES openpages.users(id),
      role TEXT NOT NULL DEFAULT 'editor',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS space_members_space_idx ON openpages.space_members(space_id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS openpages.pages (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL REFERENCES openpages.spaces(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'Untitled',
      icon TEXT DEFAULT '📄',
      content JSONB NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
      content_text TEXT NOT NULL DEFAULT '',
      parent_id TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS pages_space_idx ON openpages.pages(space_id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS openpages.page_versions (
      id TEXT PRIMARY KEY,
      page_id TEXT NOT NULL REFERENCES openpages.pages(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content JSONB NOT NULL,
      content_text TEXT NOT NULL DEFAULT '',
      actor_type TEXT NOT NULL DEFAULT 'user',
      actor_id TEXT,
      summary TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS page_versions_page_idx ON openpages.page_versions(page_id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS openpages.files (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL REFERENCES openpages.spaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'text/plain',
      size INTEGER NOT NULL DEFAULT 0,
      content_text TEXT DEFAULT '',
      storage_path TEXT,
      created_by TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS files_space_idx ON openpages.files(space_id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS openpages.page_links (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL REFERENCES openpages.spaces(id) ON DELETE CASCADE,
      from_page_id TEXT NOT NULL REFERENCES openpages.pages(id) ON DELETE CASCADE,
      to_page_id TEXT NOT NULL REFERENCES openpages.pages(id) ON DELETE CASCADE,
      label TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS openpages.conversations (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL REFERENCES openpages.spaces(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'New chat',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS conversations_space_idx ON openpages.conversations(space_id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS openpages.messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES openpages.conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT,
      context_meta JSONB,
      citations JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS messages_conversation_idx ON openpages.messages(conversation_id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS openpages.agent_runs (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL REFERENCES openpages.spaces(id) ON DELETE CASCADE,
      goal TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      steps JSONB DEFAULT '[]'::jsonb,
      context_meta JSONB,
      result TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS agent_runs_space_idx ON openpages.agent_runs(space_id)`;
}

async function seedPg(sql: Sql) {
  const rows = (await sql`SELECT COUNT(*)::int AS c FROM openpages.users`) as Array<{
    c: number;
  }>;
  if (Number(rows[0]?.c ?? 0) > 0) return;

  const now = new Date().toISOString();
  await sql`
    INSERT INTO openpages.users (id, name, email, created_at)
    VALUES ('user_local', 'Local User', 'local@openpages.dev', ${now})
  `;
  await sql`
    INSERT INTO openpages.spaces (id, name, icon, description, owner_id, settings, created_at, updated_at)
    VALUES (
      'space_demo',
      'Product Launch',
      '🚀',
      'Demo Space: humans + agents sharing memory. Every AI call runs through SuperCompress.',
      'user_local',
      ${JSON.stringify({ defaultModel: APP.defaultModel })}::jsonb,
      ${now},
      ${now}
    )
  `;
  await sql`
    INSERT INTO openpages.space_members (id, space_id, user_id, role, created_at)
    VALUES ('mem_1', 'space_demo', 'user_local', 'owner', ${now})
  `;

  const pages = [
    {
      id: "page_roadmap",
      title: "Product Roadmap",
      icon: "🗺️",
      text: `# Product Roadmap\n\n## Why OpenPages exists\nAI workspaces fail economically when every question ships the entire Space into the model.\nOpenPages fixes that by making SuperCompress the context layer.\n\n## Success metrics\n- 70%+ average token savings via SuperCompress\n- Agents cite sources on every answer`,
    },
    {
      id: "page_launch",
      title: "Launch Notes",
      icon: "📝",
      text: `# Launch Notes\n\n## Positioning\nYour workspace, built for humans and agents.\nPersistent context without persistent token costs.\n\n## Missing work\n- Engineering: MCP auth tokens\n- Marketing: SuperCompress animation\n- Launch day: support rotation`,
    },
    {
      id: "page_feedback",
      title: "Customer Feedback",
      icon: "💬",
      text: `# Customer Feedback\n\n## Themes\n1. Token costs\n2. Shared agent memory\n3. Citations\n4. Self-host`,
    },
    {
      id: "page_arch",
      title: "Architecture",
      icon: "🏗️",
      text: `# Architecture\n\nWorkspace → Retrieval → SuperCompress → Model\n\nSuperCompress is infrastructure, not a plugin.`,
    },
    {
      id: "page_sc",
      title: "About SuperCompress",
      icon: "⚡",
      text: `# About SuperCompress\n\nQuery-aware context compression.\n\nhttps://www.supercompress.dev\nhttps://docs.supercompress.dev`,
    },
  ];

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const content = {
      type: "doc",
      content: p.text.split("\n").map((line) => {
        if (line.startsWith("# ")) {
          return {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: line.slice(2) }],
          };
        }
        if (line.startsWith("## ")) {
          return {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: line.slice(3) }],
          };
        }
        if (!line.trim()) return { type: "paragraph" };
        return { type: "paragraph", content: [{ type: "text", text: line }] };
      }),
    };
    await sql`
      INSERT INTO openpages.pages (id, space_id, title, icon, content, content_text, sort_order, created_by, created_at, updated_at)
      VALUES (
        ${p.id},
        'space_demo',
        ${p.title},
        ${p.icon},
        ${JSON.stringify(content)}::jsonb,
        ${p.text},
        ${i},
        'user',
        ${now},
        ${now}
      )
    `;
  }
}

export async function ensurePgDb(): Promise<PgDb> {
  const url = getPostgresUrl();
  if (!url) throw new Error("No Postgres DATABASE_URL configured");

  if (!pgInstance) {
    const sql = neon(url);
    pgInstance = drizzle(sql, { schema });
  }

  if (!migrated) {
    const sql = neon(url);
    await migratePg(sql);
    await seedPg(sql);
    migrated = true;
  }

  return pgInstance;
}

export { schema as pgSchema };

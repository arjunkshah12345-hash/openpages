import { getPostgresUrl, ensurePgDb, pgSchema } from "./pg";
import * as sqliteSchema from "./schema";

/**
 * Database entrypoint.
 * - Neon Postgres when DATABASE_URL / POSTGRES_URL is set (Vercel)
 * - SQLite file locally for zero-config OSS installs
 *
 * Return type is intentionally loose so Drizzle's incompatible
 * Pg vs SQLite query builders don't explode the build.
 */

function activeSchema() {
  return getPostgresUrl() ? pgSchema : sqliteSchema;
}

export const schema = activeSchema() as typeof sqliteSchema;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = any;

let sqliteDb: AnyDb | null = null;

function ensureSqlite(): AnyDb {
  // Lazy-load so Vercel (Postgres) never requires the native module at runtime
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { migrate } = require("./migrate");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { seedIfEmpty } = require("./seed");

  const dataDir =
    process.env.OPENPAGES_DATA_DIR || path.join(process.cwd(), "data");
  const raw = process.env.DATABASE_URL || "";
  const dbPath = raw.startsWith("file:")
    ? raw.replace(/^file:/, "")
    : path.join(dataDir, "openpages.db");

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema: sqliteSchema });
  migrate(sqlite);
  seedIfEmpty(sqlite);
  return db;
}

export async function getDb(): Promise<AnyDb> {
  if (getPostgresUrl()) {
    return ensurePgDb();
  }
  if (!sqliteDb) sqliteDb = ensureSqlite();
  return sqliteDb;
}

export { sqliteSchema };
export type { Citation, ContextMeta, AgentStep } from "./schema";

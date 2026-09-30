import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import * as schema from "./schema";
import { migrate } from "./migrate";
import { seedIfEmpty } from "./seed";

const dataDir =
  process.env.OPENPAGES_DATA_DIR || path.join(process.cwd(), "data");

const dbPath = process.env.DATABASE_URL?.startsWith("file:")
  ? process.env.DATABASE_URL.replace(/^file:/, "")
  : path.join(dataDir, "openpages.db");

type Db = ReturnType<typeof drizzle<typeof schema>>;

let sqlite: Database.Database | null = null;
let dbInstance: Db | null = null;

function ensureDb(): Db {
  if (dbInstance) return dbInstance;

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  dbInstance = drizzle(sqlite, { schema });
  migrate(sqlite);
  seedIfEmpty(sqlite);
  return dbInstance;
}

/** Lazy singleton — safe for Next.js route handlers. */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const instance = ensureDb();
    const value = (instance as unknown as Record<string | symbol, unknown>)[
      prop
    ];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export function getDb() {
  return ensureDb();
}

export { schema };

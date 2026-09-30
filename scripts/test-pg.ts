import { getPostgresUrl, ensurePgDb, pgSchema } from "../src/lib/db/pg";

async function main() {
  console.log("url ok", !!getPostgresUrl());
  const db = await ensurePgDb();
  const spaces = await db.select().from(pgSchema.spaces);
  console.log(
    "spaces",
    spaces.length,
    spaces.map((s) => s.name)
  );
  const users = await db.select().from(pgSchema.users);
  console.log(
    "users",
    users.length,
    users.map((u) => u.id)
  );
}

main().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});

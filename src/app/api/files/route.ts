import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, schema } from "@/lib/db";

export async function GET(req: Request) {
  const spaceId = new URL(req.url).searchParams.get("spaceId");
  if (!spaceId) {
    return NextResponse.json({ error: "spaceId required" }, { status: 400 });
  }
  const db = await getDb();
  const files = await db
    .select()
    .from(schema.files)
    .where(eq(schema.files.spaceId, spaceId));
  return NextResponse.json(files);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.spaceId || !body.name) {
    return NextResponse.json(
      { error: "spaceId and name required" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const id = nanoid();
  const contentText = body.contentText || body.content || "";

  await db.insert(schema.files).values({
    id,
    spaceId: body.spaceId,
    name: body.name,
    mimeType: body.mimeType || "text/plain",
    size: contentText.length,
    contentText,
    createdBy: body.createdBy || "user",
    createdAt: new Date(),
  });

  return NextResponse.json({ id, name: body.name });
}

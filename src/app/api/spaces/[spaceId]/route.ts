import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { spaceId } = await params;
  const db = await getDb();
  const space = await db.query.spaces.findFirst({
    where: eq(schema.spaces.id, spaceId),
  });
  if (!space) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pages = await db
    .select()
    .from(schema.pages)
    .where(eq(schema.pages.spaceId, spaceId));

  const files = await db
    .select()
    .from(schema.files)
    .where(eq(schema.files.spaceId, spaceId));

  return NextResponse.json({ ...space, pages, files });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { spaceId } = await params;
  const body = await req.json();
  const db = await getDb();

  await db
    .update(schema.spaces)
    .set({
      name: body.name,
      icon: body.icon,
      description: body.description,
      settings: body.settings,
      updatedAt: new Date(),
    })
    .where(eq(schema.spaces.id, spaceId));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { spaceId } = await params;
  const db = await getDb();
  await db.delete(schema.spaces).where(eq(schema.spaces.id, spaceId));
  return NextResponse.json({ ok: true });
}

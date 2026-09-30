import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { updatePage } from "@/lib/pages";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const db = getDb();
  const versions = await db
    .select()
    .from(schema.pageVersions)
    .where(eq(schema.pageVersions.pageId, pageId))
    .orderBy(desc(schema.pageVersions.createdAt))
    .limit(50);

  return NextResponse.json(versions);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const body = await req.json();
  const versionId = body.versionId as string;
  const db = getDb();

  const version = await db.query.pageVersions.findFirst({
    where: eq(schema.pageVersions.id, versionId),
  });

  if (!version || version.pageId !== pageId) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const page = await updatePage({
    pageId,
    title: version.title,
    content: version.content,
    contentText: version.contentText,
    actorType: "user",
    summary: `Restored version from ${version.createdAt?.toISOString?.() || "history"}`,
  });

  return NextResponse.json(page);
}

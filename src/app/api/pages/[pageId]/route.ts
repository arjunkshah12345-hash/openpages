import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { updatePage, tiptapDocFromMarkdown } from "@/lib/pages";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const db = getDb();
  const page = await db.query.pages.findFirst({
    where: eq(schema.pages.id, pageId),
  });
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(page);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const body = await req.json();

  let content = body.content;
  if (!content && body.contentText) {
    content = tiptapDocFromMarkdown(body.contentText);
  }

  const page = await updatePage({
    pageId,
    title: body.title,
    content,
    contentText: body.contentText,
    icon: body.icon,
    actorType: body.actorType || "user",
    summary: body.summary,
  });

  return NextResponse.json(page);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const db = getDb();
  await db.delete(schema.pages).where(eq(schema.pages.id, pageId));
  return NextResponse.json({ ok: true });
}

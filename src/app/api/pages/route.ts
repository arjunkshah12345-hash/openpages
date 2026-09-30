import { NextResponse } from "next/server";
import { createPage } from "@/lib/pages";

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.spaceId) {
    return NextResponse.json({ error: "spaceId required" }, { status: 400 });
  }

  const page = await createPage({
    spaceId: body.spaceId,
    title: body.title || "Untitled",
    contentText: body.contentText,
    content: body.content,
    icon: body.icon,
    actorType: body.actorType || "user",
  });

  return NextResponse.json(page);
}

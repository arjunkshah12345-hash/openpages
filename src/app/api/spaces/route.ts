import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, schema } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/pages";

export async function GET() {
  const db = getDb();
  const spaces = await db
    .select()
    .from(schema.spaces)
    .orderBy(desc(schema.spaces.updatedAt));

  const withCounts = await Promise.all(
    spaces.map(async (s) => {
      const pages = await db
        .select({ id: schema.pages.id })
        .from(schema.pages)
        .where(eq(schema.pages.spaceId, s.id));
      return { ...s, pageCount: pages.length };
    })
  );

  return NextResponse.json(withCounts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = getDb();
  const id = nanoid();
  const now = new Date();

  await db.insert(schema.spaces).values({
    id,
    name: body.name || "Untitled Space",
    icon: body.icon || "◇",
    description: body.description || "",
    ownerId: LOCAL_USER_ID,
    settings: { defaultModel: body.model || "openai/gpt-4o-mini" },
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schema.spaceMembers).values({
    id: nanoid(),
    spaceId: id,
    userId: LOCAL_USER_ID,
    role: "owner",
    createdAt: now,
  });

  // Starter page
  const pageId = nanoid();
  const content = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Welcome" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "This Space is shared memory for humans and agents. Ask the agent anything — SuperCompress keeps context costs flat as the Space grows.",
          },
        ],
      },
    ],
  };

  await db.insert(schema.pages).values({
    id: pageId,
    spaceId: id,
    title: "Welcome",
    icon: "✨",
    content,
    contentText:
      "Welcome\nThis Space is shared memory for humans and agents. Ask the agent anything — SuperCompress keeps context costs flat as the Space grows.",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id, pageId });
}

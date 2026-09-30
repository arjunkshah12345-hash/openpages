import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { buildCompressedContext } from "@/lib/supercompress/pipeline";
import { generateWithPipeline } from "@/lib/ai/respond";
import { APP } from "@/lib/config";

/**
 * Chat turn: retrieve Space context → SuperCompress → model.
 * Always returns contextMeta so the Context inspector can show savings.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const {
    spaceId,
    message,
    model = APP.defaultModel,
    conversationId,
  } = body as {
    spaceId?: string;
    message?: string;
    model?: string;
    conversationId?: string;
  };

  if (!spaceId || !message) {
    return NextResponse.json(
      { error: "spaceId and message required" },
      { status: 400 }
    );
  }

  const db = await getDb();
  let convId = conversationId;

  if (!convId) {
    convId = nanoid();
    await db.insert(schema.conversations).values({
      id: convId,
      spaceId,
      title: String(message).slice(0, 80),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await db.insert(schema.messages).values({
    id: nanoid(),
    conversationId: convId,
    role: "user",
    content: message,
    createdAt: new Date(),
  });

  const pipeline = await buildCompressedContext({
    spaceId,
    query: message,
    conversationId: convId,
    modelId: model,
  });

  const { content } = await generateWithPipeline({
    model,
    systemPrompt: pipeline.systemPrompt,
    userPrompt: message,
    meta: pipeline.meta,
  });

  const messageId = nanoid();
  await db.insert(schema.messages).values({
    id: messageId,
    conversationId: convId,
    role: "assistant",
    content,
    model,
    contextMeta: pipeline.meta,
    citations: pipeline.meta.sources,
    createdAt: new Date(),
  });

  await db
    .update(schema.conversations)
    .set({ updatedAt: new Date() })
    .where(eq(schema.conversations.id, convId));

  return NextResponse.json({
    conversationId: convId,
    messageId,
    content,
    contextMeta: pipeline.meta,
    citations: pipeline.meta.sources,
    pipeline: pipeline.summary,
  });
}

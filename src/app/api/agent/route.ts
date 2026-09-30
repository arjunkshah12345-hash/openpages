import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, schema } from "@/lib/db";
import { buildCompressedContext } from "@/lib/supercompress/pipeline";
import { generateWithPipeline } from "@/lib/ai/respond";
import { createPage } from "@/lib/pages";
import {
  buildLaunchPageDrafts,
  shouldCreateLaunchPages,
} from "@/lib/agent/launch-pages";
import type { AgentStep, ContextMeta } from "@/lib/db/schema";
import { formatPct, formatTokens } from "@/lib/utils";
import { APP } from "@/lib/config";

/**
 * Multi-step agent run.
 * Always: search → SuperCompress → reason / mutate pages → activity timeline.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { spaceId, goal, model = APP.defaultModel } = body as {
    spaceId?: string;
    goal?: string;
    model?: string;
  };

  if (!spaceId || !goal) {
    return NextResponse.json(
      { error: "spaceId and goal required" },
      { status: 400 }
    );
  }

  const db = getDb();
  const runId = nanoid();
  const steps: AgentStep[] = [];

  const push = (
    label: string,
    status: AgentStep["status"],
    detail?: string
  ): AgentStep => {
    const step: AgentStep = {
      id: nanoid(),
      label,
      status,
      detail,
      at: Date.now(),
    };
    steps.push(step);
    return step;
  };

  await db.insert(schema.agentRuns).values({
    id: runId,
    spaceId,
    goal,
    status: "running",
    steps,
    createdAt: new Date(),
  });

  push("Searching workspace", "running");

  const pipeline = await buildCompressedContext({
    spaceId,
    query: goal,
    modelId: model,
  });

  steps[0].status = "done";
  steps[0].detail = `Found ${pipeline.meta.sources.length} relevant documents`;

  push("Compressing with SuperCompress", "done", pipeline.summary);

  push(
    "Reading sources",
    "done",
    pipeline.meta.sources.map((s) => s.title).join(", ") || "none"
  );

  const createdPages: Array<{ id: string; title: string }> = [];
  let result: string;

  if (shouldCreateLaunchPages(goal)) {
    for (const draft of buildLaunchPageDrafts(pipeline.meta)) {
      push(`Creating ${draft.title}`, "running");
      const page = await createPage({
        spaceId,
        title: draft.title,
        contentText: draft.text,
        icon: draft.icon,
        actorType: "agent",
      });
      createdPages.push({ id: page.id, title: page.title });
      steps[steps.length - 1].status = "done";
      steps[steps.length - 1].detail = `Created ${page.title}`;
    }
    push("Linking related pages", "done", "Linked launch workstreams");
    push("Done", "done");
    result = formatLaunchResult(createdPages, pipeline.meta);
  } else {
    push("Drafting answer", "running");
    const { content } = await generateWithPipeline({
      model,
      systemPrompt: pipeline.systemPrompt,
      userPrompt: `Complete this multi-step workspace goal and describe actions taken:\n\n${goal}`,
      meta: pipeline.meta,
    });
    result = content;
    steps[steps.length - 1].status = "done";
    push("Done", "done");
  }

  await db
    .update(schema.agentRuns)
    .set({
      status: "completed",
      steps,
      contextMeta: pipeline.meta,
      result,
      completedAt: new Date(),
    })
    .where(eq(schema.agentRuns.id, runId));

  return NextResponse.json({
    runId,
    steps,
    contextMeta: pipeline.meta,
    result,
    createdPages,
    pipeline: pipeline.summary,
  });
}

function formatLaunchResult(
  createdPages: Array<{ id: string; title: string }>,
  meta: ContextMeta
) {
  return `Completed the goal.

**Created pages**
${createdPages.map((p) => `- ${p.title}`).join("\n")}

**Sources used**
${meta.sources.map((s) => `- ${s.title}`).join("\n") || "- (none)"}

**SuperCompress**
${formatTokens(meta.originalTokens)} → ${formatTokens(meta.compressedTokens)} tokens (${formatPct(meta.tokensSavedPct)} compressed)`;
}

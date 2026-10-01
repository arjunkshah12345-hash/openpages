import { generateText } from "ai";
import type { ContextMeta } from "@/lib/db/schema";
import { getLanguageModel, hasAnyModelKey } from "@/lib/models/providers";
import { formatPct, formatTokens } from "@/lib/utils";

/**
 * Call the selected model with a SuperCompress-built system prompt,
 * or return a deterministic demo reply that still surfaces compression stats.
 */
export async function generateWithPipeline(options: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  meta: ContextMeta;
}): Promise<{ content: string; usedModel: boolean }> {
  if (!hasAnyModelKey()) {
    return {
      content: demoReply(options.userPrompt, options.meta),
      usedModel: false,
    };
  }

  try {
    const result = await generateText({
      model: getLanguageModel(options.model),
      system: options.systemPrompt,
      prompt: options.userPrompt,
    });
    return { content: result.text, usedModel: true };
  } catch (e) {
    const reason = e instanceof Error ? e.message : "error";
    return {
      content: `Model call failed (${reason}). SuperCompress still ran for this turn.\n\n${demoReply(options.userPrompt, options.meta)}`,
      usedModel: false,
    };
  }
}

export function demoReply(message: string, meta: ContextMeta): string {
  const cite = meta.sources.length
    ? meta.sources.map((s) => `[${s.title}]`).join(", ")
    : "[workspace]";

  return `Based on your Space (${cite}):

${heuristicAnswer(message)}

---
Context used: ${formatTokens(meta.originalTokens)} → ${formatTokens(meta.compressedTokens)} tokens (${formatPct(meta.tokensSavedPct)} compressed with SuperCompress${meta.provider ? ` · ${meta.provider}` : ""})

Connect a model in onboarding (ChatGPT account, API key, or Ollama) for live completions. Retrieval + SuperCompress already ran.`;
}

function heuristicAnswer(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("missing") || m.includes("launch")) {
    return `Launch gaps from Launch Notes and Product Roadmap:
1. Engineering — finalize MCP auth tokens
2. Marketing — before/after SuperCompress animation on the landing page
3. Launch day — support rotation schedule

I can create dedicated pages for engineering, marketing, and launch day in Agent mode.`;
  }
  if (m.includes("feedback") || m.includes("customer")) {
    return `Customer Feedback themes:
• Token costs from dumping whole workspaces into models
• Shared persistent memory between humans and agents
• Citations on every answer
• Self-host / Docker for enterprises

SuperCompress + the context inspector directly address the cost theme.`;
  }
  if (m.includes("architecture") || m.includes("supercompress") || m.includes("pipeline")) {
    return `Architecture pipeline:

Workspace → Retrieval → SuperCompress → Model

SuperCompress sits before the provider so Spaces can grow without context windows (and bills) growing with them.`;
  }
  return `I searched the Space, compressed retrieved context with SuperCompress, and kept only evidence relevant to your question. Open the context inspector to see sources and token savings.`;
}

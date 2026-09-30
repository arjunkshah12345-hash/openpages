import { compressContext, formatCompressSummary } from "@/lib/supercompress/client";
import { retrieveSpaceContext } from "@/lib/retrieval/search";
import type { ContextMeta } from "@/lib/db/schema";
import { pipelineLabel } from "@/lib/config";

export type PipelineResult = {
  compressedContext: string;
  meta: ContextMeta;
  systemPrompt: string;
  summary: string;
};

/**
 * Core OpenPages inference pipeline — the only path chat, agent, and MCP
 * workspace_context should use before calling a model:
 *
 *   Workspace → Retrieval → SuperCompress → Model
 *
 * SuperCompress is not optional here. Even the local fallback runs so the
 * Context inspector always has real before/after stats.
 */
export async function buildCompressedContext(options: {
  spaceId: string;
  query: string;
  conversationId?: string;
  modelId?: string;
}): Promise<PipelineResult> {
  const retrieval = await retrieveSpaceContext(options.spaceId, options.query, {
    conversationId: options.conversationId,
    limit: 14,
  });

  const compressed = await compressContext(
    retrieval.assembledContext,
    options.query
  );

  const meta: ContextMeta = {
    sources: retrieval.sources,
    originalTokens: compressed.originalTokens,
    compressedTokens: compressed.keptTokens,
    tokensSavedPct: compressed.tokensSavedPct,
    originalContext: retrieval.assembledContext,
    compressedContext: compressed.compressedText,
    mode: compressed.mode,
    provider: compressed.source,
    policyName: compressed.policyName,
  };

  const summary = formatCompressSummary(compressed);

  const systemPrompt = [
    "You are the OpenPages workspace agent.",
    "Humans and AI agents share this Space as persistent memory.",
    "",
    "Rules:",
    "- Answer ONLY from the SuperCompress-compressed workspace context below.",
    "- Cite sources by page/file title when used (e.g. [Product Roadmap]).",
    "- If context is insufficient, say what is missing and suggest pages to create.",
    "- Be concise, specific, and actionable.",
    "- When asked to create or edit pages, describe proposed changes clearly.",
    "",
    `Inference pipeline: ${pipelineLabel()}`,
    `SuperCompress this turn: ${summary}`,
    "",
    "## Workspace context (compressed by SuperCompress)",
    "",
    compressed.compressedText,
  ].join("\n");

  return {
    compressedContext: compressed.compressedText,
    meta,
    systemPrompt,
    summary,
  };
}

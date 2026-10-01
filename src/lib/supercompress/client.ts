import { estimateTokens } from "@/lib/utils";
import { SUPERCOMPRESS } from "@/lib/config";
import {
  resolveForceLocalCompress,
  resolveSuperCompressKey,
  resolveSuperCompressUrl,
} from "@/lib/settings/store";

/**
 * SuperCompress client for OpenPages.
 *
 * This is the product’s economic engine: every AI turn compresses retrieved
 * workspace context against the user query before any model provider is called.
 *
 * Hosted API: https://docs.supercompress.dev
 * Local fallback keeps the app usable offline / without an API key.
 * Credentials: onboarding settings (~/.openpages) then env.
 */

export type CompressMode = "compiler" | "precision";

export type CompressResult = {
  compressedText: string;
  originalTokens: number;
  keptTokens: number;
  tokensSaved: number;
  tokensSavedPct: number;
  mode: string;
  policyName: string;
  /** `api` = SuperCompress hosted; `local` = offline stand-in */
  source: "api" | "local";
  keptBlocks?: Array<{ text?: string; reason?: string }>;
  droppedBlocks?: Array<{ text?: string; reason?: string }>;
};

export type CompressOptions = {
  mode?: CompressMode;
  /** Force local compressor even if an API key is present */
  forceLocal?: boolean;
};

/**
 * Compress `context` for `query`. The query is never modified or compressed.
 */
export async function compressContext(
  context: string,
  query: string,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const mode = options.mode ?? SUPERCOMPRESS.defaultMode;
  const trimmed = context.trim();

  if (!trimmed) {
    return emptyResult(mode);
  }

  const apiKey = resolveSuperCompressKey();
  const forceLocal = options.forceLocal || resolveForceLocalCompress();

  if (!forceLocal && apiKey) {
    const apiResult = await compressViaApi(trimmed, query, mode, apiKey);
    if (apiResult) return apiResult;
  }

  return compressLocally(trimmed, query, mode);
}

async function compressViaApi(
  context: string,
  query: string,
  mode: CompressMode,
  apiKey: string
): Promise<CompressResult | null> {
  const primary = resolveSuperCompressUrl();
  const urls = Array.from(
    new Set([primary, SUPERCOMPRESS.apiUrl, SUPERCOMPRESS.fallbackApiUrl])
  );

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ context, query, mode }),
      });

      if (!res.ok) continue;

      const data = (await res.json()) as Record<string, unknown>;
      return normalizeApiResult(data, context, mode);
    } catch {
      // try next URL
    }
  }

  return null;
}

function normalizeApiResult(
  data: Record<string, unknown>,
  originalContext: string,
  mode: CompressMode
): CompressResult {
  const compressedText = String(
    data.compressed_text ?? data.compressedText ?? originalContext
  );
  const originalTokens = Number(
    data.original_tokens ?? data.originalTokens ?? estimateTokens(originalContext)
  );
  const keptTokens = Number(
    data.kept_tokens ?? data.keptTokens ?? estimateTokens(compressedText)
  );
  const tokensSaved = Math.max(0, originalTokens - keptTokens);
  const tokensSavedPct = Number(
    data.tokens_saved_pct ??
      data.tokensSavedPct ??
      (originalTokens > 0 ? (tokensSaved / originalTokens) * 100 : 0)
  );

  return {
    compressedText,
    originalTokens,
    keptTokens,
    tokensSaved,
    tokensSavedPct,
    mode: String(data.mode ?? mode),
    policyName: String(
      data.policy_name ?? data.policyName ?? "SuperCompress-compiler"
    ),
    source: "api",
    keptBlocks: data.kept_blocks as CompressResult["keptBlocks"],
    droppedBlocks: data.dropped_blocks as CompressResult["droppedBlocks"],
  };
}

/**
 * Offline query-aware compressor.
 * Not a substitute for the SuperCompress API — a faithful stand-in so the
 * Context inspector and pipeline still demonstrate savings without a key.
 */
function compressLocally(
  context: string,
  query: string,
  mode: CompressMode
): CompressResult {
  const originalTokens = estimateTokens(context);
  const terms = tokenize(query);
  const blocks = context
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  // Small contexts: still drop clearly irrelevant blocks when we have terms
  if (blocks.length <= 1 || terms.size === 0) {
    return {
      compressedText: context,
      originalTokens,
      keptTokens: originalTokens,
      tokensSaved: 0,
      tokensSavedPct: 0,
      mode,
      policyName: "local-passthrough",
      source: "local",
    };
  }

  const scored = blocks.map((block, i) => {
    const tokens = tokenize(block);
    let score = 0;
    for (const t of terms) {
      if (tokens.has(t)) score += 3;
    }
    if (/^#{1,3}\s|^\*\*|### (Page|File|Chat):|SOURCE:/.test(block)) {
      score += 1.5;
    }
    // Soft length penalty
    score -= Math.max(0, tokens.size - 100) * 0.01;
    return { block, i, score };
  });

  const positive = scored.filter((s) => s.score > 0);
  const keepBudget = Math.max(
    2,
    Math.ceil(blocks.length * (positive.length >= 2 ? 0.4 : 0.55))
  );

  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const keepIdx = new Set<number>();

  for (const item of ranked.slice(0, keepBudget)) {
    keepIdx.add(item.i);
    if (item.score >= 3) {
      if (item.i > 0) keepIdx.add(item.i - 1);
      if (item.i < blocks.length - 1) keepIdx.add(item.i + 1);
    }
  }

  // Prefer keeping at least one structured heading block
  const heading = scored.find((s) => /^#{1,3}\s|### /.test(s.block));
  if (heading) keepIdx.add(heading.i);

  const kept = blocks.filter((_, i) => keepIdx.has(i));
  const compressedText = kept.join("\n\n");
  const keptTokens = estimateTokens(compressedText);
  const tokensSaved = Math.max(0, originalTokens - keptTokens);
  const tokensSavedPct =
    originalTokens > 0 ? (tokensSaved / originalTokens) * 100 : 0;

  return {
    compressedText,
    originalTokens,
    keptTokens,
    tokensSaved,
    tokensSavedPct,
    mode,
    policyName: "local-query-aware",
    source: "local",
  };
}

function emptyResult(mode: string): CompressResult {
  return {
    compressedText: "",
    originalTokens: 0,
    keptTokens: 0,
    tokensSaved: 0,
    tokensSavedPct: 0,
    mode,
    policyName: "empty",
    source: "local",
  };
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

/** One-line summary for agent timelines / UI badges. */
export function formatCompressSummary(result: CompressResult): string {
  return `${result.originalTokens.toLocaleString()} → ${result.keptTokens.toLocaleString()} tokens (${result.tokensSavedPct.toFixed(1)}% via SuperCompress · ${result.source})`;
}

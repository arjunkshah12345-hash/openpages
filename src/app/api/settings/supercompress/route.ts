import { NextResponse } from "next/server";
import {
  resolveSuperCompressKey,
  resolveSuperCompressUrl,
  setSuperCompress,
  toPublicSettings,
} from "@/lib/settings/store";

export const runtime = "nodejs";

/**
 * Save (optional) + probe SuperCompress hosted API.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    apiKey?: string;
    apiUrl?: string;
    save?: boolean;
  };

  const normalizedKey = body.apiKey
    ? body.apiKey.trim().replace(/^Bearer\s+/i, "")
    : undefined;

  if (body.save && (normalizedKey || body.apiUrl !== undefined)) {
    setSuperCompress({
      ...(normalizedKey ? { apiKey: normalizedKey, forceLocal: false } : {}),
      ...(body.apiUrl !== undefined ? { apiUrl: body.apiUrl || undefined } : {}),
    });
  }

  const apiKey = normalizedKey || resolveSuperCompressKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Paste your SuperCompress API key. Get one free at https://www.supercompress.dev/dashboard",
        settings: toPublicSettings(),
      },
      { status: 400 }
    );
  }

  const url = body.apiUrl || resolveSuperCompressUrl();
  const sampleContext =
    "OpenPages uses SuperCompress before every model call.\n\nIrrelevant filling about lunch menus and office plants.\n\nSource: launch checklist — ship MCP auth tokens.";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        context: sampleContext,
        query: "What is left on the launch checklist?",
        mode: "compiler",
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        {
          ok: false,
          error: `SuperCompress returned ${res.status}: ${text.slice(0, 200) || res.statusText}`,
          settings: toPublicSettings(),
        },
        { status: 400 }
      );
    }

    const data = (await res.json()) as Record<string, unknown>;
    return NextResponse.json({
      ok: true,
      url,
      originalTokens: data.original_tokens ?? data.originalTokens,
      keptTokens: data.kept_tokens ?? data.keptTokens,
      tokensSavedPct: data.tokens_saved_pct ?? data.tokensSavedPct,
      settings: toPublicSettings(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Network error talking to SuperCompress",
        settings: toPublicSettings(),
      },
      { status: 400 }
    );
  }
}

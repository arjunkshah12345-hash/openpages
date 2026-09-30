import { and, desc, eq, like, or } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { Citation } from "@/lib/db/schema";

export type RetrievedChunk = {
  type: "page" | "file" | "message";
  id: string;
  title: string;
  text: string;
  score: number;
};

export type RetrievalResult = {
  chunks: RetrievedChunk[];
  sources: Citation[];
  assembledContext: string;
};

/**
 * Query-aware workspace retrieval. Scores pages/files by term overlap,
 * returns ranked candidates for SuperCompress.
 */
export async function retrieveSpaceContext(
  spaceId: string,
  query: string,
  options?: { limit?: number; conversationId?: string }
): Promise<RetrievalResult> {
  const db = await getDb();
  const limit = options?.limit ?? 12;
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const pages = await db
    .select()
    .from(schema.pages)
    .where(eq(schema.pages.spaceId, spaceId))
    .orderBy(desc(schema.pages.updatedAt));

  const files = await db
    .select()
    .from(schema.files)
    .where(eq(schema.files.spaceId, spaceId));

  const scored: RetrievedChunk[] = [];

  for (const page of pages) {
    const text = `${page.title}\n${page.contentText || ""}`;
    const score = scoreText(text, terms, query);
    if (score > 0 || terms.length === 0) {
      scored.push({
        type: "page",
        id: page.id,
        title: page.title,
        text: text.slice(0, 12000),
        score: score || 0.1,
      });
    }
  }

  for (const file of files) {
    const text = `${file.name}\n${file.contentText || ""}`;
    const score = scoreText(text, terms, query);
    if (score > 0 || terms.length === 0) {
      scored.push({
        type: "file",
        id: file.id,
        title: file.name,
        text: text.slice(0, 8000),
        score: score || 0.05,
      });
    }
  }

  if (options?.conversationId) {
    const msgs = await db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.conversationId, options.conversationId))
      .orderBy(desc(schema.messages.createdAt))
      .limit(8);

    for (const m of msgs.reverse()) {
      scored.push({
        type: "message",
        id: m.id,
        title: `${m.role} message`,
        text: m.content.slice(0, 2000),
        score: 0.5,
      });
    }
  }

  // If nothing matched, take most recently updated pages
  if (scored.filter((c) => c.type !== "message").length === 0) {
    for (const page of pages.slice(0, 6)) {
      scored.push({
        type: "page",
        id: page.id,
        title: page.title,
        text: `${page.title}\n${page.contentText || ""}`.slice(0, 8000),
        score: 0.2,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const chunks = scored.slice(0, limit);

  const sources: Citation[] = [];
  const seen = new Set<string>();
  for (const c of chunks) {
    if (c.type === "message") continue;
    const key = `${c.type}:${c.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sources.push({ type: c.type, id: c.id, title: c.title });
  }

  const assembledContext = chunks
    .map((c) => {
      const kind = c.type === "page" ? "Page" : c.type === "file" ? "File" : "Chat";
      return `### ${kind}: ${c.title}\n${c.text}`;
    })
    .join("\n\n---\n\n");

  return { chunks, sources, assembledContext };
}

export async function searchSpace(spaceId: string, query: string) {
  const db = await getDb();
  const q = `%${query}%`;

  const pageHits = await db
    .select({
      id: schema.pages.id,
      title: schema.pages.title,
      icon: schema.pages.icon,
      snippet: schema.pages.contentText,
    })
    .from(schema.pages)
    .where(
      and(
        eq(schema.pages.spaceId, spaceId),
        or(
          like(schema.pages.title, q),
          like(schema.pages.contentText, q)
        )
      )
    )
    .limit(20);

  const fileHits = await db
    .select({
      id: schema.files.id,
      name: schema.files.name,
      snippet: schema.files.contentText,
    })
    .from(schema.files)
    .where(
      and(
        eq(schema.files.spaceId, spaceId),
        or(like(schema.files.name, q), like(schema.files.contentText, q))
      )
    )
    .limit(10);

  return {
    pages: pageHits.map((p: { id: string; title: string; icon: string | null; snippet: string | null }) => ({
      ...p,
      snippet: (p.snippet || "").slice(0, 200),
    })),
    files: fileHits.map((f: { id: string; name: string; snippet: string | null }) => ({
      ...f,
      snippet: (f.snippet || "").slice(0, 200),
    })),
  };
}

function scoreText(text: string, terms: string[], query: string): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  let score = 0;

  if (query && lower.includes(query.toLowerCase())) {
    score += 10;
  }

  for (const term of terms) {
    let idx = 0;
    let count = 0;
    while ((idx = lower.indexOf(term, idx)) !== -1) {
      count++;
      idx += term.length;
      if (count > 20) break;
    }
    score += count;
    // Title-weight: early occurrence
    if (lower.slice(0, 120).includes(term)) score += 2;
  }

  return score;
}

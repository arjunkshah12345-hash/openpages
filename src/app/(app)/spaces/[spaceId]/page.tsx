import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, Sparkles } from "lucide-react";

export default async function SpaceHome({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  const db = await getDb();
  const space = await db.query.spaces.findFirst({
    where: eq(schema.spaces.id, spaceId),
  });
  if (!space) notFound();

  const pages = await db
    .select()
    .from(schema.pages)
    .where(eq(schema.pages.spaceId, spaceId))
    .orderBy(desc(schema.pages.updatedAt))
    .limit(8);

  const runs = await db
    .select()
    .from(schema.agentRuns)
    .where(eq(schema.agentRuns.spaceId, spaceId))
    .orderBy(desc(schema.agentRuns.createdAt))
    .limit(5);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-4xl">{space.icon}</div>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)]">
              {space.name}
            </h1>
            <p className="mt-2 max-w-lg text-[var(--ink-muted)]">
              {space.description ||
                "A shared workspace for humans and agents."}
            </p>
          </div>
          <Button variant="accent" asChild>
            <Link href={`/spaces/${spaceId}/agent`}>
              <MessageSquare className="h-4 w-4" />
              Ask agent
            </Link>
          </Button>
        </div>

        <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]/40 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
            <Sparkles className="h-4 w-4" />
            SuperCompress is the context layer
          </div>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Workspace → Retrieval → SuperCompress → Model. Every answer
            exposes token savings in the context inspector — that is what
            keeps large Spaces economically viable.
          </p>
        </div>

        <section className="mt-12">
          <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--ink-faint)]">
            Recent pages
          </h2>
          <ul className="mt-3 divide-y divide-[var(--border)] border-t border-[var(--border)]">
            {pages.map((p: { id: string; title: string; icon: string | null }) => (
              <li key={p.id}>
                <Link
                  href={`/spaces/${spaceId}/pages/${p.id}`}
                  className="flex items-center gap-3 py-3 text-sm text-[var(--ink)] hover:text-[var(--accent)]"
                >
                  <span>{p.icon || "📄"}</span>
                  <span className="flex-1 truncate font-medium">{p.title}</span>
                  <FileText className="h-3.5 w-3.5 text-[var(--ink-faint)]" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {runs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--ink-faint)]">
              Agent activity
            </h2>
            <ul className="mt-3 space-y-2">
              {runs.map((r: { id: string; goal: string; status: string; contextMeta: { tokensSavedPct?: number } | null }) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm"
                >
                  <div className="font-medium text-[var(--ink)]">{r.goal}</div>
                  <div className="mt-1 text-xs text-[var(--ink-faint)]">
                    {r.status}
                    {r.contextMeta
                      ? ` · ${r.contextMeta.tokensSavedPct?.toFixed?.(1) ?? ""}% compressed`
                      : ""}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

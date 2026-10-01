import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, ArrowRight } from "lucide-react";

function initial(name: string) {
  return (name.trim()[0] || "S").toUpperCase();
}

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
    <div className="h-full overflow-y-auto bg-white text-[var(--ink)]">
      <div className="mx-auto max-w-[640px] px-8 py-16 md:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="grid size-12 place-items-center rounded-[10px] border border-[#d4dcd3] bg-[#e4ece2] text-[15px] font-semibold text-[#547149]">
              {initial(space.name)}
            </div>
            <h1 className="op-display mt-6 text-[clamp(2rem,4vw,2.75rem)]">
              {space.name}
            </h1>
            <p className="mt-3 max-w-[460px] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
              {space.description ||
                "A shared workspace for humans and agents."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:pt-2">
            <Button asChild>
              <Link href={`/spaces/${spaceId}/agent`}>
                <MessageSquare className="h-4 w-4" />
                Message Space
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/spaces/${spaceId}/agent?mode=agent`}>
                Agent mode
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href={`/spaces/${spaceId}/files`}>Files</Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 rounded-[14px] border border-[rgba(5,102,255,0.15)] bg-[#e8f0ff] px-5 py-4">
          <p className="text-[13px] font-medium text-[#0450cc]">
            SuperCompress
          </p>
          <p className="mt-1 text-[14px] leading-[1.55] text-[var(--ink-muted)]">
            Workspace → Retrieval → SuperCompress → Model. Savings show in the
            context rail on every answer.
          </p>
        </div>

        <section className="mt-14">
          <p className="op-eyebrow">Recent pages</p>
          <ul className="mt-3 divide-y divide-[#e4e4de] border-t border-[#e4e4de]">
            {pages.map(
              (p: { id: string; title: string; icon: string | null }) => (
                <li key={p.id}>
                  <Link
                    href={`/spaces/${spaceId}/pages/${p.id}`}
                    className="group flex items-center gap-3 py-3.5 text-[14px] text-[#20201e]"
                  >
                    <FileText className="h-4 w-4 text-[#93938b]" />
                    <span className="flex-1 truncate font-medium tracking-tight">
                      {p.title}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#93938b] opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              )
            )}
            {pages.length === 0 && (
              <li className="py-8 text-[13px] text-[#93938b]">
                No pages yet — create one from the sidebar.
              </li>
            )}
          </ul>
        </section>

        {runs.length > 0 && (
          <section className="mt-14">
            <p className="op-eyebrow">Agent activity</p>
            <ul className="mt-4 space-y-2">
              {runs.map(
                (r: {
                  id: string;
                  goal: string;
                  status: string;
                  contextMeta: { tokensSavedPct?: number } | null;
                }) => (
                  <li
                    key={r.id}
                    className="rounded-[16px] border border-[#e4e4de] bg-[#fbfbf9] px-4 py-3.5"
                  >
                    <div className="text-[14px] font-medium tracking-tight">
                      {r.goal}
                    </div>
                    <div className="mt-1 text-[12px] text-[#93938b]">
                      {r.status}
                      {r.contextMeta?.tokensSavedPct != null
                        ? ` · ${Number(r.contextMeta.tokensSavedPct).toFixed(1)}% compressed`
                        : ""}
                    </div>
                  </li>
                )
              )}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { SpaceShell } from "@/components/space/space-shell";
import { notFound } from "next/navigation";

export default async function SpaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  const db = await getDb();
  const space = await db.query.spaces.findFirst({
    where: eq(schema.spaces.id, spaceId),
  });
  if (!space) notFound();

  const pages = await db
    .select({
      id: schema.pages.id,
      title: schema.pages.title,
      icon: schema.pages.icon,
      sortOrder: schema.pages.sortOrder,
    })
    .from(schema.pages)
    .where(eq(schema.pages.spaceId, spaceId));

  pages.sort(
    (
      a: { sortOrder: number; title: string },
      b: { sortOrder: number; title: string }
    ) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)
  );

  return (
    <SpaceShell
      space={{
        id: space.id,
        name: space.name,
        icon: space.icon,
        description: space.description,
      }}
      pages={pages.map(
        (p: { id: string; title: string; icon: string | null }) => ({
          id: p.id,
          title: p.title,
          icon: p.icon,
        })
      )}
    >
      {children}
    </SpaceShell>
  );
}

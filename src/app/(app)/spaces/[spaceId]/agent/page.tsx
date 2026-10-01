import { AgentPanel } from "@/components/agent/agent-panel";

export default async function AgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ spaceId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { spaceId } = await params;
  const sp = await searchParams;
  const initialMode = sp.mode === "agent" ? "agent" : "chat";

  return <AgentPanel spaceId={spaceId} initialMode={initialMode} />;
}

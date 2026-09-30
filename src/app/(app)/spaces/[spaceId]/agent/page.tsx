import { AgentModeTabs } from "@/components/agent/agent-mode-tabs";

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

  return <AgentModeTabs spaceId={spaceId} initialMode={initialMode} />;
}

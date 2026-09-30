"use client";

import { useState } from "react";
import { AgentPanel } from "@/components/agent/agent-panel";
import { cn } from "@/lib/utils";

export function AgentModeTabs({
  spaceId,
  initialMode,
}: {
  spaceId: string;
  initialMode: "chat" | "agent";
}) {
  const [mode, setMode] = useState<"chat" | "agent">(initialMode);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-[var(--border)] px-4 py-2">
        <button
          type="button"
          onClick={() => setMode("chat")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            mode === "chat"
              ? "bg-[var(--surface-2)] text-[var(--ink)]"
              : "text-[var(--ink-faint)] hover:text-[var(--ink)]"
          )}
        >
          Chat
        </button>
        <button
          type="button"
          onClick={() => setMode("agent")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            mode === "agent"
              ? "bg-[var(--surface-2)] text-[var(--ink)]"
              : "text-[var(--ink-faint)] hover:text-[var(--ink)]"
          )}
        >
          Agent mode
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <AgentPanel spaceId={spaceId} mode={mode} />
      </div>
    </div>
  );
}

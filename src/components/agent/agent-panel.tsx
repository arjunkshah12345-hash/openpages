"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ContextInspector } from "@/components/context/context-inspector";
import type { AgentStep, ContextMeta } from "@/lib/db/schema";
import { MODEL_OPTIONS } from "@/lib/models/providers";
import { formatPct, formatTokens, cn } from "@/lib/utils";
import {
  ArrowUp,
  Bot,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
} from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  contextMeta?: ContextMeta | null;
  citations?: Array<{ type: string; id: string; title: string }>;
};

export function AgentPanel({
  spaceId,
  mode = "chat",
}: {
  spaceId: string;
  mode?: "chat" | "agent";
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("openai/gpt-4o-mini");
  const [loading, setLoading] = useState(false);
  const [latestMeta, setLatestMeta] = useState<ContextMeta | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, steps]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((m) => [...m, userMsg]);

    try {
      if (mode === "agent") {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spaceId, goal: text, model }),
        });
        const data = await res.json();
        setSteps(data.steps || []);
        setLatestMeta(data.contextMeta || null);
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: data.result || "Agent finished.",
            contextMeta: data.contextMeta,
            citations: data.contextMeta?.sources,
          },
        ]);
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spaceId,
            message: text,
            model,
            conversationId,
          }),
        });
        const data = await res.json();
        if (data.conversationId) setConversationId(data.conversationId);
        setLatestMeta(data.contextMeta || null);
        setMessages((m) => [
          ...m,
          {
            id: data.messageId || `a-${Date.now()}`,
            role: "assistant",
            content: data.content,
            contextMeta: data.contextMeta,
            citations: data.citations,
          },
        ]);
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Error: ${e instanceof Error ? e.message : "Request failed"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <div>
            <h1 className="text-sm font-semibold text-[var(--ink)]">
              {mode === "agent" ? "Agent mode" : "Workspace agent"}
            </h1>
            <p className="text-xs text-[var(--ink-faint)]">
              Workspace → Retrieval → SuperCompress → Model
            </p>
          </div>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="h-8 rounded-md border border-[var(--border)] bg-[var(--paper)] px-2 text-xs text-[var(--ink-muted)]"
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
          {messages.length === 0 && (
            <EmptyState mode={mode} onSuggest={setInput} />
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-[var(--ink)] text-[var(--paper)]"
                    : "bg-[var(--surface)] text-[var(--ink)]"
                )}
              >
                {msg.content}
                {msg.contextMeta && (
                  <div className="mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-2 text-[11px] text-[var(--ink-faint)]">
                    <Sparkles className="h-3 w-3 text-[var(--accent)]" />
                    {formatTokens(msg.contextMeta.originalTokens)} →{" "}
                    {formatTokens(msg.contextMeta.compressedTokens)} ·{" "}
                    {formatPct(msg.contextMeta.tokensSavedPct)} compressed
                  </div>
                )}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.citations.map((c) => (
                      <span
                        key={`${c.type}-${c.id}`}
                        className="rounded-md border border-[var(--border)] bg-[var(--paper)] px-1.5 py-0.5 text-[10px] text-[var(--ink-muted)]"
                      >
                        {c.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {mode === "agent" && steps.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4">
              <div className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--ink-faint)]">
                Activity
              </div>
              <ol className="space-y-2">
                {steps.map((s) => (
                  <li key={s.id} className="flex items-start gap-2 text-sm">
                    {s.status === "done" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--accent)]" />
                    ) : s.status === "running" ? (
                      <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-[var(--accent)]" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 text-[var(--ink-faint)]" />
                    )}
                    <div>
                      <div className="text-[var(--ink)]">{s.label}</div>
                      {s.detail && (
                        <div className="text-xs text-[var(--ink-faint)]">
                          {s.detail}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-[var(--ink-faint)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Retrieving Space · compressing with SuperCompress…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-[var(--border)] p-4">
          <div className="relative mx-auto max-w-3xl">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={
                mode === "agent"
                  ? "Describe a multi-step goal for the agent…"
                  : "Ask anything about this Space…"
              }
              className="min-h-[56px] resize-none pr-12"
              rows={2}
            />
            <Button
              variant="accent"
              size="icon"
              className="absolute bottom-2 right-2"
              onClick={() => void send()}
              disabled={loading || !input.trim()}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden w-[320px] shrink-0 overflow-y-auto border-l border-[var(--border)] bg-[var(--sidebar)] p-4 lg:block">
        <ContextInspector meta={latestMeta} />
      </div>
    </div>
  );
}

function EmptyState({
  mode,
  onSuggest,
}: {
  mode: "chat" | "agent";
  onSuggest: (s: string) => void;
}) {
  const suggestions =
    mode === "agent"
      ? [
          "Read everything about the launch, create a launch plan, and make pages for engineering, marketing, and launch day.",
          "Compare Product Roadmap and Customer Feedback, then create a prioritized backlog page.",
          "Summarize Architecture and link related pages.",
        ]
      : [
          "What are we missing for launch?",
          "Summarize customer feedback themes.",
          "How does SuperCompress fit in the architecture?",
        ];

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
        <Sparkles className="h-5 w-5" />
      </div>
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
        {mode === "agent" ? "Multi-step agent" : "Ask your Space"}
      </h2>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        Context is retrieved from pages & files, compressed with{" "}
        <span className="text-[var(--accent)]">SuperCompress</span>, then sent
        to your model — never a raw Space dump.
      </p>
      <div className="mt-6 space-y-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggest(s)}
            className="block w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-left text-sm text-[var(--ink-muted)] transition hover:border-[var(--accent)]/40 hover:text-[var(--ink)]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ContextInspector } from "@/components/context/context-inspector";
import type { AgentStep, ContextMeta } from "@/lib/db/schema";
import { MODEL_OPTIONS } from "@/lib/models/catalog";
import { formatPct, formatTokens, cn } from "@/lib/utils";
import {
  ArrowUp,
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
  initialMode = "chat",
}: {
  spaceId: string;
  initialMode?: "chat" | "agent";
}) {
  const [mode, setMode] = useState<"chat" | "agent">(initialMode);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("chatgpt/gpt-5.4-mini");
  const [loading, setLoading] = useState(false);
  const [latestMeta, setLatestMeta] = useState<ContextMeta | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.defaultModel) setModel(s.defaultModel);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, steps]);

  useEffect(() => {
    setMessages([]);
    setSteps([]);
    setLatestMeta(null);
    setConversationId(null);
  }, [mode]);

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
        if (!res.ok) throw new Error(data.error || "Agent failed");
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
        if (!res.ok) throw new Error(data.error || "Chat failed");
        if (data.conversationId) setConversationId(data.conversationId);
        setLatestMeta(data.contextMeta || null);
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: data.content || "Done.",
            contextMeta: data.contextMeta,
            citations: data.contextMeta?.sources || data.citations,
          },
        ]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      toast.error(msg);
      setMessages((m) => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Something went wrong: ${msg}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 bg-[#fdfdfb] text-[var(--ink)]">
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eeeeea] px-4 py-3 md:px-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full bg-[var(--surface)] p-0.5">
              {(
                [
                  ["chat", "Chat"],
                  ["agent", "Agent"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                    mode === id
                      ? "bg-white text-[var(--ink)] shadow-sm"
                      : "text-[var(--ink-faint)] hover:text-[var(--ink)]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="hidden items-center gap-1.5 text-[12px] text-[var(--ink-faint)] sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5 text-[#737d61]" />
              after SuperCompress
            </span>
          </div>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="h-8 max-w-[min(100%,220px)] rounded-full border border-[var(--border)] bg-[var(--paper)] px-3 text-[11px] tracking-normal text-[var(--ink-muted)] outline-none focus:ring-2 focus:ring-[var(--ink)]/10"
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-7 md:px-6 md:py-8">
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
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e4ece2] text-[#547149]">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[min(85%,36rem)] px-4 py-3 text-[14px] leading-[1.65] whitespace-pre-wrap",
                  msg.role === "user"
                    ? "rounded-[14px_14px_4px_14px] bg-[#efefe9] text-[var(--ink)]"
                    : "rounded-[14px] text-[#797b70]"
                )}
              >
                {msg.content}
                {msg.contextMeta && (
                  <div className="mt-3 border-t border-[var(--border)] pt-2 text-[11px] font-medium text-[var(--ink-faint)]">
                    {formatTokens(msg.contextMeta.originalTokens)} →{" "}
                    {formatTokens(msg.contextMeta.compressedTokens)} ·{" "}
                    {formatPct(msg.contextMeta.tokensSavedPct)} · SuperCompress
                  </div>
                )}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.citations.map((c) => (
                      <span
                        key={`${c.type}-${c.id}`}
                        className="rounded-full border border-[var(--border)] bg-[var(--paper)] px-2 py-0.5 text-[10px] font-medium text-[var(--ink-muted)]"
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
            <div className="rounded-[14px] border border-[var(--border)] bg-[var(--paper)] p-4">
              <div className="op-eyebrow mb-3">Activity</div>
              <ol className="space-y-2.5">
                {steps.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start gap-2.5 text-[13px]"
                  >
                    {s.status === "done" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--brand)]" />
                    ) : s.status === "running" ? (
                      <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-[var(--brand)]" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 text-[var(--ink-faint)]" />
                    )}
                    <div>
                      <div className="font-medium text-[var(--ink)]">
                        {s.label}
                      </div>
                      {s.detail && (
                        <div className="text-[12px] text-[var(--ink-faint)]">
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
            <div className="flex items-center gap-2 text-[13px] text-[var(--ink-faint)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Retrieving · compressing with SuperCompress…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-[#eeeeea] bg-white p-4 md:p-5">
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
                  ? "Describe a multi-step goal…"
                  : "Ask anything about this Space…"
              }
              className="min-h-[52px] resize-none rounded-[16px] border-[var(--border)] bg-[var(--paper)] px-5 py-3.5 pr-14 text-[14px] shadow-none"
              rows={2}
            />
            <Button
              size="icon"
              className="absolute bottom-2.5 right-2.5 size-9"
              onClick={() => void send()}
              disabled={loading || !input.trim()}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden w-[280px] shrink-0 overflow-y-auto border-l border-[#e9e9e4] bg-[#fdfdfb] p-4 lg:block">
        <p className="op-eyebrow mb-3">Context</p>
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
    <div className="mx-auto max-w-md py-12 md:py-16">
      <Sparkles className="mb-4 h-7 w-7 text-[#737e61]" />
      <h2 className="text-[22px] font-medium tracking-[-0.03em] text-[var(--ink)]">
        {mode === "agent" ? "What should we work on?" : "Ask your Space"}
      </h2>
      <p className="mt-3 max-w-sm text-[14px] leading-[1.7] text-[var(--ink-muted)]">
        Pages and files become context.{" "}
        <span className="font-medium text-[#0566ff]">SuperCompress</span> keeps
        only what matters, then your model answers.
      </p>
      <div className="mt-8 space-y-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggest(s)}
            className="block w-full rounded-[12px] bg-[#efefe9] px-4 py-3.5 text-left text-[13px] leading-snug tracking-normal text-[var(--ink-muted)] transition hover:bg-[#eaeae4] hover:text-[var(--ink)]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

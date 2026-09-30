import type { ContextMeta } from "@/lib/db/schema";
import { formatPct, formatTokens, cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, FileText, Layers, Sparkles } from "lucide-react";
import { useState } from "react";

export function ContextInspector({
  meta,
  className,
}: {
  meta: ContextMeta | null;
  className?: string;
}) {
  const [open, setOpen] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showCompressed, setShowCompressed] = useState(false);

  if (!meta) {
    return (
      <div
        className={cn(
          "rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4 text-sm text-[var(--ink-faint)]",
          className
        )}
      >
        Ask anything — OpenPages retrieves Space context, runs SuperCompress,
        then calls your model. Savings show up here.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--paper)] overflow-hidden",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[var(--surface)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-sm font-medium text-[var(--ink)]">
            Context inspector
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[var(--ink-faint)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--ink-faint)]" />
        )}
      </button>

      {open && (
        <div className="border-t border-[var(--border)] px-4 py-4 space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--ink-faint)] mb-2">
              Sources
            </div>
            <ul className="space-y-1.5">
              {meta.sources.map((s) => (
                <li
                  key={`${s.type}-${s.id}`}
                  className="flex items-center gap-2 text-sm text-[var(--ink-muted)]"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{s.title}</span>
                </li>
              ))}
              {meta.sources.length === 0 && (
                <li className="text-sm text-[var(--ink-faint)]">No sources</li>
              )}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Retrieved"
              value={`${formatTokens(meta.originalTokens)} tok`}
            />
            <Stat
              label="Sent"
              value={`${formatTokens(meta.compressedTokens)} tok`}
              accent
            />
          </div>

            <div className="rounded-lg bg-[var(--accent-soft)] px-3 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
                <Layers className="h-4 w-4" />
                SuperCompress
              </div>
              <span className="text-sm font-semibold text-[var(--accent)]">
                {formatPct(meta.tokensSavedPct)} saved
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/60">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(2, meta.tokensSavedPct))}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              {formatTokens(meta.originalTokens)} →{" "}
              {formatTokens(meta.compressedTokens)} tokens
              {meta.provider === "api"
                ? " · hosted API"
                : meta.provider === "local"
                  ? " · local fallback"
                  : ""}
              {meta.policyName ? ` · ${meta.policyName}` : ""}
            </p>
            <p className="mt-1 text-[10px] text-[var(--ink-faint)]">
              Query-aware compression — evidence kept, noise dropped
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowCompressed(!showCompressed)}
              className="text-xs font-medium text-[var(--accent)] hover:underline"
            >
              {showCompressed ? "Hide" : "Inspect"} compressed context
            </button>
            {showCompressed && (
              <pre className="max-h-48 overflow-auto rounded-lg bg-[var(--surface)] p-3 text-[11px] leading-relaxed text-[var(--ink-muted)] whitespace-pre-wrap">
                {meta.compressedContext}
              </pre>
            )}
            <button
              type="button"
              onClick={() => setShowOriginal(!showOriginal)}
              className="block text-xs font-medium text-[var(--ink-faint)] hover:underline"
            >
              {showOriginal ? "Hide" : "Show"} original retrieved context
            </button>
            {showOriginal && (
              <pre className="max-h-48 overflow-auto rounded-lg bg-[var(--surface)] p-3 text-[11px] leading-relaxed text-[var(--ink-muted)] whitespace-pre-wrap">
                {meta.originalContext}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 text-sm font-semibold",
          accent ? "text-[var(--accent)]" : "text-[var(--ink)]"
        )}
      >
        {value}
      </div>
    </div>
  );
}

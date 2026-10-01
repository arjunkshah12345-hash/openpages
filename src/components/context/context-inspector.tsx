import type { ContextMeta } from "@/lib/db/schema";
import { formatPct, formatTokens, cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
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
          "rounded-[16px] border border-[#e4e4de] bg-white p-4 text-[13px] leading-[1.55] tracking-normal text-[#93938b]",
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
        "overflow-hidden rounded-[16px] border border-[#e4e4de] bg-white",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#fbfbf9]"
      >
        <span className="text-[13px] font-medium tracking-tight text-[#20201e]">
          Inspector
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[#93938b]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#93938b]" />
        )}
      </button>

      {open && (
        <div className="space-y-4 border-t border-[#e4e4de] px-4 py-4">
          <div>
            <div className="op-eyebrow mb-2">Sources</div>
            <ul className="space-y-1.5">
              {meta.sources.map((s) => (
                <li
                  key={`${s.type}-${s.id}`}
                  className="flex items-center gap-2 text-[13px] tracking-normal text-[#72726c]"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-[#93938b]" />
                  <span className="truncate">{s.title}</span>
                </li>
              ))}
              {meta.sources.length === 0 && (
                <li className="text-[13px] text-[#93938b]">No sources</li>
              )}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Stat label="Retrieved" value={formatTokens(meta.originalTokens)} />
            <Stat
              label="Kept"
              value={formatTokens(meta.compressedTokens)}
              sc
            />
          </div>

          <div className="rounded-[14px] border border-[rgba(5,102,255,0.15)] bg-[#e8f0ff] px-3.5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium text-[#0450cc]">
                SuperCompress
              </span>
              <span className="text-[12.5px] font-medium text-[#0450cc]">
                {formatPct(meta.tokensSavedPct)}
              </span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#0566ff] transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(2, meta.tokensSavedPct))}%`,
                }}
              />
            </div>
            <p className="mt-2 text-[11px] tracking-normal text-[#72726c]">
              {formatTokens(meta.originalTokens)} →{" "}
              {formatTokens(meta.compressedTokens)} tokens
              {meta.provider === "api"
                ? " · hosted"
                : meta.provider === "local"
                  ? " · local"
                  : ""}
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowCompressed(!showCompressed)}
              className="text-[12px] font-medium text-[#0566ff] hover:underline"
            >
              {showCompressed ? "Hide" : "Inspect"} compressed context
            </button>
            {showCompressed && (
              <pre className="max-h-48 overflow-auto rounded-[12px] bg-[#fbfbf9] p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-[#72726c]">
                {meta.compressedContext}
              </pre>
            )}
            <button
              type="button"
              onClick={() => setShowOriginal(!showOriginal)}
              className="block text-[12px] font-medium text-[#93938b] hover:underline"
            >
              {showOriginal ? "Hide" : "Show"} original retrieved context
            </button>
            {showOriginal && (
              <pre className="max-h-48 overflow-auto rounded-[12px] bg-[#fbfbf9] p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-[#72726c]">
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
  sc,
}: {
  label: string;
  value: string;
  sc?: boolean;
}) {
  return (
    <div className="rounded-[12px] border border-[#e4e4de] bg-[#fbfbf9] px-3 py-2.5">
      <div className="op-eyebrow">{label}</div>
      <div
        className={cn(
          "mt-1 text-[14px] font-medium tabular-nums tracking-tight",
          sc ? "text-[#0566ff]" : "text-[#20201e]"
        )}
      >
        {value}
      </div>
    </div>
  );
}

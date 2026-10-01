"use client";

import { PageEditor } from "@/components/editor/page-editor";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, History, X } from "lucide-react";
import type { JSONContent } from "@tiptap/react";

type Version = {
  id: string;
  title: string;
  actorType: string;
  summary: string | null;
  createdAt: string | number | Date;
};

export default function PageView() {
  const params = useParams<{ spaceId: string; pageId: string }>();
  const [page, setPage] = useState<{
    id: string;
    title: string;
    content: JSONContent;
  } | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [versions, setVersions] = useState<Version[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    void fetch(`/api/pages/${params.pageId}`)
      .then((r) => r.json())
      .then((data) => {
        setPage({
          id: data.id,
          title: data.title,
          content: data.content,
        });
      });
  }, [params.pageId]);

  const loadVersions = async () => {
    const res = await fetch(`/api/versions/${params.pageId}`);
    const data = await res.json();
    setVersions(data);
    setShowHistory(true);
  };

  const restore = async (versionId: string) => {
    await fetch(`/api/versions/${params.pageId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    const res = await fetch(`/api/pages/${params.pageId}`);
    const data = await res.json();
    setPage({
      id: data.id,
      title: data.title,
      content: data.content,
    });
    setShowHistory(false);
    window.location.reload();
  };

  if (!page) {
    return (
      <div className="flex h-full items-center justify-center bg-white text-[13px] text-[var(--ink-faint)]">
        Loading page…
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-y-auto bg-white text-[var(--ink)]">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#f0f0eb] bg-white/92 px-6 py-3 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-2 text-[12px] text-[var(--ink-faint)]">
          <span className="truncate font-medium tracking-tight text-[var(--ink-muted)]">
            {page.title || "Untitled"}
          </span>
          <span className="text-[#bbb]">·</span>
          {saveState === "saving" ? (
            <span>Saving…</span>
          ) : saveState === "saved" ? (
            <span className="inline-flex items-center gap-1 text-[var(--brand)]">
              <Check className="h-3 w-3" />
              Saved
            </span>
          ) : (
            <span>Ready</span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => void loadVersions()}>
          <History className="h-3.5 w-3.5" />
          History
        </Button>
      </div>

      <div className="mx-auto max-w-[720px] px-8 py-10 md:py-14">
        <PageEditor
          key={page.id + page.title}
          pageId={page.id}
          initialContent={page.content}
          initialTitle={page.title}
          onSaveState={setSaveState}
        />
      </div>

      {showHistory && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/10 backdrop-blur-[1px]"
            aria-label="Close history"
            onClick={() => setShowHistory(false)}
          />
          <div className="fixed inset-y-0 right-0 z-40 w-[320px] border-l border-[var(--border)] bg-[#fdfdfb] shadow-[0_0_60px_-20px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3.5">
              <span className="text-[14px] font-medium tracking-tight">
                Version history
              </span>
              <button
                type="button"
                className="rounded-[8px] p-1.5 text-[var(--ink-faint)] hover:bg-white hover:text-[var(--ink)]"
                onClick={() => setShowHistory(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="max-h-[calc(100vh-56px)] space-y-2 overflow-y-auto p-3">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="rounded-[12px] border border-[var(--border)] bg-white p-3.5"
                >
                  <div className="text-[13.5px] font-medium tracking-tight text-[var(--ink)]">
                    {v.title}
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--ink-faint)]">
                    {v.actorType}
                    {v.summary ? ` · ${v.summary}` : ""}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => void restore(v.id)}
                  >
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

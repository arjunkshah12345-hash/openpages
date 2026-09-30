"use client";

import { PageEditor } from "@/components/editor/page-editor";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
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
      <div className="flex h-full items-center justify-center text-sm text-[var(--ink-faint)]">
        Loading page…
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-y-auto">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--paper)]/90 px-6 py-2 backdrop-blur">
        <div className="text-xs text-[var(--ink-faint)]">
          {saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "Saved"
              : "Ready"}
        </div>
        <Button variant="ghost" size="sm" onClick={() => void loadVersions()}>
          <History className="h-3.5 w-3.5" />
          History
        </Button>
      </div>

      <div className="px-8 py-8">
        <PageEditor
          key={page.id + page.title}
          pageId={page.id}
          initialContent={page.content}
          initialTitle={page.title}
          onSaveState={setSaveState}
        />
      </div>

      {showHistory && (
        <div className="fixed inset-y-0 right-0 z-40 w-80 border-l border-[var(--border)] bg-[var(--paper)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <span className="text-sm font-medium">Version history</span>
            <button
              type="button"
              className="text-xs text-[var(--ink-faint)]"
              onClick={() => setShowHistory(false)}
            >
              Close
            </button>
          </div>
          <ul className="overflow-y-auto p-3 space-y-2 max-h-[calc(100vh-52px)]">
            {versions.map((v) => (
              <li
                key={v.id}
                className="rounded-lg border border-[var(--border)] p-3 text-sm"
              >
                <div className="font-medium text-[var(--ink)]">{v.title}</div>
                <div className="mt-1 text-[11px] text-[var(--ink-faint)]">
                  {v.actorType}
                  {v.summary ? ` · ${v.summary}` : ""}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => void restore(v.id)}
                >
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

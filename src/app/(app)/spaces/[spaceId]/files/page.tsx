"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Paperclip } from "lucide-react";

type FileRow = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string | number;
};

export default function FilesPage() {
  const params = useParams<{ spaceId: string }>();
  const [files, setFiles] = useState<FileRow[]>([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const load = () => {
    void fetch(`/api/files?spaceId=${params.spaceId}`)
      .then((r) => r.json())
      .then(setFiles);
  };

  useEffect(load, [params.spaceId]);

  const upload = async () => {
    if (!name.trim()) return;
    await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spaceId: params.spaceId,
        name,
        contentText: content,
        mimeType: "text/plain",
      }),
    });
    setName("");
    setContent("");
    load();
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Files
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Uploaded documents become retrievable context for the agent and
          SuperCompress pipeline.
        </p>

        <div className="mt-8 space-y-3 rounded-xl border border-[var(--border)] p-4">
          <Input
            placeholder="filename.md"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            placeholder="Paste file contents…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
          />
          <Button variant="accent" onClick={() => void upload()}>
            <Paperclip className="h-3.5 w-3.5" />
            Add file
          </Button>
        </div>

        <ul className="mt-8 divide-y divide-[var(--border)] border-t border-[var(--border)]">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-3 text-sm">
              <Paperclip className="h-4 w-4 text-[var(--ink-faint)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{f.name}</div>
                <div className="text-xs text-[var(--ink-faint)]">
                  {f.size} bytes · {f.mimeType}
                </div>
              </div>
            </li>
          ))}
          {files.length === 0 && (
            <li className="py-10 text-center text-sm text-[var(--ink-faint)]">
              No files yet
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

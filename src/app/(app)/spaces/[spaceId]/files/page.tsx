"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Paperclip, FileText } from "lucide-react";

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
    <div className="h-full overflow-y-auto bg-white px-8 py-16 text-[var(--ink)]">
      <div className="mx-auto max-w-[640px]">
        <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.12em] text-[var(--ink-faint)]">
          <span className="inline-block size-1.5 rounded-full bg-[var(--brand)]" />
          CONTEXT SOURCES
        </div>
        <h1 className="op-display mt-4 text-[clamp(1.85rem,3.5vw,2.5rem)]">
          Files
        </h1>
        <p className="mt-3 text-[16px] leading-[1.65] text-[var(--ink-muted)]">
          Uploaded documents become retrievable context — after SuperCompress —
          for chat and agents.
        </p>

        <div className="mt-10 space-y-3 rounded-[14px] border border-[var(--border)] bg-[var(--paper)] p-5">
          <Input
            placeholder="filename.md"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
          />
          <Textarea
            placeholder="Paste file contents…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
          />
          <Button onClick={() => void upload()}>
            <Paperclip className="h-3.5 w-3.5" />
            Add file
          </Button>
        </div>

        <ul className="mt-12 divide-y divide-[var(--border)] border-t border-[var(--border)]">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 py-3.5 text-[14px]"
            >
              <FileText className="h-4 w-4 text-[var(--ink-faint)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium tracking-tight">
                  {f.name}
                </div>
                <div className="text-[12px] text-[var(--ink-faint)]">
                  {Math.round(f.size / 1024)} KB · {f.mimeType}
                </div>
              </div>
            </li>
          ))}
          {files.length === 0 && (
            <li className="py-10 text-center text-[13px] text-[var(--ink-faint)]">
              No files yet — add a note, brief, or dump of research.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

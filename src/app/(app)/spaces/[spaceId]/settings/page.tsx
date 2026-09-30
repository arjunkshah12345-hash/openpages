"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { MODEL_OPTIONS } from "@/lib/models/providers";

export default function SettingsPage() {
  const params = useParams<{ spaceId: string }>();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("◇");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("openai/gpt-4o-mini");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void fetch(`/api/spaces/${params.spaceId}`)
      .then((r) => r.json())
      .then((s) => {
        setName(s.name || "");
        setIcon(s.icon || "◇");
        setDescription(s.description || "");
        setModel(s.settings?.defaultModel || "openai/gpt-4o-mini");
      });
  }, [params.spaceId]);

  const save = async () => {
    await fetch(`/api/spaces/${params.spaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        icon,
        description,
        settings: { defaultModel: model },
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Space settings
        </h1>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[var(--ink-faint)]">
            Name
          </span>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[var(--ink-faint)]">
            Icon
          </span>
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[var(--ink-faint)]">
            Description
          </span>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[var(--ink-faint)]">
            Default model
          </span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--paper)] px-3 text-sm"
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]/50 p-4 text-sm">
          <div className="font-medium text-[var(--accent)]">SuperCompress</div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
            Every chat, agent run, and MCP <code className="text-[11px]">workspace_context</code>{" "}
            call runs: retrieve → SuperCompress → model. Set{" "}
            <code className="text-[11px]">SUPERCOMPRESS_API_KEY</code> for the
            hosted compiler; without it, OpenPages uses a local offline stand-in
            so the context inspector still works.
          </p>
          <a
            href="https://www.supercompress.dev/dashboard"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs font-medium text-[var(--accent)] hover:underline"
          >
            Get an API key →
          </a>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--ink-muted)]">
          <div className="font-medium text-[var(--ink)]">MCP</div>
          <p className="mt-1 text-xs leading-relaxed">
            Point MCP clients at this Space with{" "}
            <code className="text-[11px]">OPENPAGES_SPACE_ID={params.spaceId}</code>{" "}
            and <code className="text-[11px]">node mcp/server.mjs</code>.
          </p>
        </div>

        <Button variant="accent" onClick={() => void save()}>
          {saved ? "Saved" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}

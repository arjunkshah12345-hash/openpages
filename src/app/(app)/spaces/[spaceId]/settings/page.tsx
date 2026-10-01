"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { MODEL_OPTIONS } from "@/lib/models/catalog";

export default function SettingsPage() {
  const params = useParams<{ spaceId: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("chatgpt/gpt-5.4-mini");
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void (async () => {
      const [spaceRes, settingsRes] = await Promise.all([
        fetch(`/api/spaces/${params.spaceId}`),
        fetch("/api/settings"),
      ]);
      const s = await spaceRes.json();
      const machine = await settingsRes.json();
      setName(s.name || "");
      setDescription(s.description || "");
      setModel(
        s.settings?.defaultModel ||
          machine.defaultModel ||
          "chatgpt/gpt-5.4-mini"
      );
    })();
  }, [params.spaceId]);

  const save = async () => {
    try {
      const res = await fetch(`/api/spaces/${params.spaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          settings: { defaultModel: model },
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      toast.success("Settings saved");
      setTimeout(() => setSaved(false), 1500);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  const removeSpace = async () => {
    if (deleteConfirm.trim() !== name.trim()) {
      toast.error("Type the Space name exactly to confirm");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/spaces/${params.spaceId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Space deleted");
      router.push("/spaces");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-white px-8 py-16 text-[var(--ink)]">
      <div className="mx-auto max-w-[520px] space-y-7">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.12em] text-[var(--ink-faint)]">
            <span className="inline-block size-1.5 rounded-full bg-[var(--brand)]" />
            SPACE
          </div>
          <h1 className="op-display mt-4 text-[clamp(1.85rem,3.5vw,2.5rem)]">
            Settings
          </h1>
          <p className="mt-3 text-[16px] leading-[1.65] text-[var(--ink-muted)]">
            Name, default model, and how this Space connects to SuperCompress.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-[12px] font-medium text-[var(--ink-faint)]">
            Name
          </span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[12px] font-medium text-[var(--ink-faint)]">
            Description
          </span>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[12px] font-medium text-[var(--ink-faint)]">
            Default model
          </span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 text-[14px] tracking-normal outline-none focus:ring-2 focus:ring-[var(--ink)]/10"
          >
            <optgroup label="ChatGPT account">
              {MODEL_OPTIONS.filter((m) => m.provider === "chatgpt").map(
                (m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                    {m.badge ? ` · ${m.badge}` : ""}
                  </option>
                )
              )}
            </optgroup>
            <optgroup label="OpenAI API">
              {MODEL_OPTIONS.filter((m) => m.provider === "openai").map(
                (m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                    {m.badge ? ` · ${m.badge}` : ""}
                  </option>
                )
              )}
            </optgroup>
            <optgroup label="Other providers">
              {MODEL_OPTIONS.filter(
                (m) => m.provider !== "chatgpt" && m.provider !== "openai"
              ).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.provider})
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <div className="rounded-[14px] border border-[rgba(5,102,255,0.15)] bg-[#e8f0ff] p-4">
          <div className="text-[13px] font-medium text-[#0450cc]">
            Bring your own inference
          </div>
          <p className="mt-1.5 text-[13px] leading-[1.55] text-[var(--ink-muted)]">
            Connect ChatGPT (no API key), an OpenAI platform key, Claude,
            Gemini, Ollama, and more. Every call still runs retrieve →
            SuperCompress → model. Credentials live in{" "}
            <code className="text-[11px]">~/.openpages/settings.json</code>.
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            <a
              href="/onboarding"
              className="text-[13px] font-medium text-[#0566ff] hover:underline"
            >
              Manage providers &amp; Login with ChatGPT →
            </a>
            <a
              href="https://www.supercompress.dev/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-[13px] font-medium text-[#0566ff] hover:underline"
            >
              SuperCompress dashboard →
            </a>
          </div>
        </div>

        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--paper)] p-4">
          <div className="text-[13px] font-medium text-[var(--ink)]">MCP</div>
          <p className="mt-1.5 text-[13px] leading-[1.55] text-[var(--ink-muted)]">
            Point MCP clients at this Space with{" "}
            <code className="text-[11px]">
              OPENPAGES_SPACE_ID={params.spaceId}
            </code>{" "}
            and <code className="text-[11px]">node mcp/server.mjs</code>.
          </p>
        </div>

        <Button onClick={() => void save()}>
          {saved ? "Saved" : "Save settings"}
        </Button>

        <div className="rounded-[14px] border border-red-200/80 bg-red-50/50 p-4">
          <div className="text-[13px] font-medium text-red-800">Danger zone</div>
          <p className="mt-1.5 text-[13px] leading-[1.55] text-red-800/80">
            Delete this Space and all of its pages, files, and chat history.
            Type <span className="font-medium">{name || "the Space name"}</span>{" "}
            to confirm.
          </p>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={name || "Space name"}
            className="mt-3 h-10 border-red-200 bg-white"
            autoComplete="off"
          />
          <Button
            variant="outline"
            className="mt-3 border-red-300 text-red-700 hover:bg-red-50"
            disabled={deleting || deleteConfirm.trim() !== name.trim() || !name}
            onClick={() => void removeSpace()}
          >
            {deleting ? "Deleting…" : "Delete Space"}
          </Button>
        </div>
      </div>
    </div>
  );
}

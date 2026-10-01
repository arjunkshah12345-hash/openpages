"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Plus, ArrowUpRight, Loader2 } from "lucide-react";
import { BrandMark } from "@/components/brand/mark";

type SpaceRow = {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  pageCount: number;
};

function initial(name: string) {
  return (name.trim()[0] || "S").toUpperCase();
}

export default function SpacesIndex() {
  const [spaces, setSpaces] = useState<SpaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/spaces");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load Spaces");
      setSpaces(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load Spaces");
      setSpaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Untitled Space",
          icon: "◇",
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create Space");
      window.location.href = `/spaces/${data.id}`;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create Space");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)]/70 bg-[var(--paper)]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1120px] items-center justify-between px-6">
          <Link
            href="/"
            className="op-mark inline-flex items-center gap-2.5 text-[18px] text-[var(--ink)]"
          >
            <BrandMark size={22} />
            OpenPages
          </Link>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Space
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[720px] px-6 py-16 md:py-24">
        <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.12em] text-[var(--ink-faint)]">
          <span className="inline-block size-1.5 rounded-full bg-[var(--brand)]" />
          YOUR WORKSPACES
        </div>
        <h1 className="op-display mt-5 text-[clamp(2.5rem,6vw,4.25rem)]">
          Spaces
        </h1>
        <p className="mt-6 max-w-[460px] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
          A little room for your biggest ideas — pages, files, and an agent that
          reads what you&apos;ve gathered. SuperCompress keeps context focused.
        </p>

        {creating && (
          <div className="mt-10 rounded-[16px] border border-[var(--border)] bg-white p-6 shadow-[0_6px_18px_#292b2a07]">
            <p className="text-[13px] font-medium text-[var(--ink-faint)]">
              New Space
            </p>
            <Input
              placeholder="Space name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-4 h-11"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") void create();
              }}
            />
            <Textarea
              placeholder="What is this Space for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-3"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setCreating(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={() => void create()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create Space
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-14 flex items-center gap-2 text-[14px] text-[var(--ink-faint)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Spaces…
          </div>
        ) : (
          <ul className="mt-14 space-y-2">
            {spaces.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/spaces/${s.id}`}
                  className="group flex items-center gap-4 rounded-[14px] border border-[var(--border)] bg-white px-5 py-4 transition-colors hover:bg-[var(--surface)]"
                >
                  <div className="grid size-11 shrink-0 place-items-center rounded-[10px] border border-[#d4dcd3] bg-[#e4ece2] text-[14px] font-semibold text-[#547149]">
                    {initial(s.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-medium tracking-tight">
                        {s.name}
                      </span>
                      <ArrowUpRight className="size-3.5 text-[var(--ink-faint)] opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-[var(--ink-faint)]">
                      {s.description || "No description"}
                    </p>
                  </div>
                  <span className="hidden text-[12px] text-[var(--ink-faint)] sm:inline">
                    {s.pageCount} {s.pageCount === 1 ? "page" : "pages"}
                  </span>
                </Link>
              </li>
            ))}
            {spaces.length === 0 && !creating && (
              <li className="rounded-[14px] border border-dashed border-[var(--border-strong)] px-5 py-12 text-center">
                <p className="text-[15px] text-[var(--ink-muted)]">
                  No Spaces yet — start one and make room for an idea.
                </p>
                <Button className="mt-4" onClick={() => setCreating(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Start a Space
                </Button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

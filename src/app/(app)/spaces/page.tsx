"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Plus, ArrowLeft } from "lucide-react";

type SpaceRow = {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  pageCount: number;
};

export default function SpacesIndex() {
  const [spaces, setSpaces] = useState<SpaceRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("◇");
  const [description, setDescription] = useState("");

  const load = () => {
    void fetch("/api/spaces")
      .then((r) => r.json())
      .then(setSpaces);
  };

  useEffect(load, []);

  const create = async () => {
    const res = await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || "Untitled Space",
        icon: icon || "◇",
        description,
      }),
    });
    const data = await res.json();
    window.location.href = `/spaces/${data.id}`;
  };

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[var(--ink-faint)] hover:text-[var(--ink)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
              Spaces
            </h1>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Persistent workspaces for humans and agents.
            </p>
          </div>
          <Button variant="accent" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            New Space
          </Button>
        </div>

        {creating && (
          <div className="mt-8 space-y-3 rounded-2xl border border-[var(--border)] p-5">
            <div className="flex gap-3">
              <Input
                className="w-20 text-center text-lg"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
              />
              <Input
                placeholder="Space name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button variant="accent" onClick={() => void create()}>
                Create
              </Button>
            </div>
          </div>
        )}

        <ul className="mt-10 space-y-2">
          {spaces.map((s) => (
            <li key={s.id}>
              <Link
                href={`/spaces/${s.id}`}
                className="flex items-center gap-4 rounded-xl border border-[var(--border)] px-5 py-4 transition hover:border-[var(--accent)]/30 hover:bg-[var(--surface)]/50"
              >
                <span className="text-2xl">{s.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--ink)]">{s.name}</div>
                  <div className="truncate text-sm text-[var(--ink-faint)]">
                    {s.description || "No description"}
                  </div>
                </div>
                <div className="text-xs text-[var(--ink-faint)]">
                  {s.pageCount} pages
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

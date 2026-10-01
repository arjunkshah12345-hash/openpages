"use client";

import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { SpaceSidebar } from "@/components/space/space-sidebar";
import { BrandMark } from "@/components/brand/mark";
import Link from "next/link";

type PageItem = { id: string; title: string; icon: string | null };
type SpaceInfo = {
  id: string;
  name: string;
  icon: string;
  description: string | null;
};

export function SpaceShell({
  space,
  pages,
  children,
}: {
  space: SpaceInfo;
  pages: PageItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--paper)] text-[var(--ink)] lg:flex-row">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--sidebar)] px-3 lg:hidden">
        <button
          type="button"
          className="rounded-md p-2 text-[var(--ink-muted)] hover:bg-white hover:text-[var(--ink)]"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </button>
        <Link
          href={`/spaces/${space.id}`}
          className="op-mark flex min-w-0 items-center gap-2 text-[14px]"
        >
          <BrandMark size={18} />
          <span className="truncate">{space.name}</span>
        </Link>
      </header>

      <div className="hidden h-full lg:flex">
        <SpaceSidebar space={space} pages={pages} />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-[min(280px,88vw)] flex-col bg-[var(--sidebar)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
              <span className="text-[12px] font-medium text-[var(--ink-muted)]">
                Navigation
              </span>
              <button
                type="button"
                className="rounded-md p-2 text-[var(--ink-faint)] hover:bg-white"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1" onClick={() => setOpen(false)}>
              <SpaceSidebar space={space} pages={pages} />
            </div>
          </div>
        </div>
      )}

      <main className="op-shell min-h-0 min-w-0 flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquare,
  Settings,
  Plus,
  Search,
  Paperclip,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PageItem = {
  id: string;
  title: string;
  icon: string | null;
};

type SpaceInfo = {
  id: string;
  name: string;
  icon: string;
  description: string | null;
};

export function SpaceSidebar({
  space,
  pages,
}: {
  space: SpaceInfo;
  pages: PageItem[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = pages.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );

  const createPage = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: space.id,
          title: "Untitled",
        }),
      });
      const data = await res.json();
      router.push(`/spaces/${space.id}/pages/${data.id}`);
      router.refresh();
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)]">
      <div className="flex items-center gap-2 px-3 py-3">
        <Link
          href="/spaces"
          className="rounded-md p-1.5 text-[var(--ink-faint)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 truncate text-sm font-semibold text-[var(--ink)]">
            <span className="text-base leading-none">{space.icon}</span>
            <span className="truncate">{space.name}</span>
          </div>
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-faint)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            className="h-8 pl-8 text-xs bg-[var(--paper)]"
          />
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-2 pb-2">
        <NavLink
          href={`/spaces/${space.id}`}
          active={pathname === `/spaces/${space.id}`}
          icon={<Sparkles className="h-3.5 w-3.5" />}
        >
          Overview
        </NavLink>
        <NavLink
          href={`/spaces/${space.id}/agent`}
          active={pathname.includes("/agent")}
          icon={<MessageSquare className="h-3.5 w-3.5" />}
        >
          Agent
        </NavLink>
        <NavLink
          href={`/spaces/${space.id}/files`}
          active={pathname.includes("/files")}
          icon={<Paperclip className="h-3.5 w-3.5" />}
        >
          Files
        </NavLink>
        <NavLink
          href={`/spaces/${space.id}/settings`}
          active={pathname.includes("/settings")}
          icon={<Settings className="h-3.5 w-3.5" />}
        >
          Settings
        </NavLink>
      </nav>

      <div className="mt-1 flex items-center justify-between px-4 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-faint)]">
          Pages
        </span>
        <button
          type="button"
          onClick={createPage}
          disabled={creating}
          className="rounded p-0.5 text-[var(--ink-faint)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          title="New page"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {filtered.map((page) => {
          const href = `/spaces/${space.id}/pages/${page.id}`;
          const active = pathname === href;
          return (
            <Link
              key={page.id}
              href={href}
              className={cn(
                "mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                active
                  ? "bg-[var(--surface-2)] text-[var(--ink)] font-medium"
                  : "text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
              )}
            >
              <span className="text-sm leading-none">{page.icon || "📄"}</span>
              <span className="truncate">{page.title}</span>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-2 py-6 text-center text-xs text-[var(--ink-faint)]">
            No pages yet
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)] p-3">
        <Button
          variant="accent"
          size="sm"
          className="w-full"
          onClick={() => router.push(`/spaces/${space.id}/agent`)}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Open agent
        </Button>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
        active
          ? "bg-[var(--surface-2)] text-[var(--ink)] font-medium"
          : "text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

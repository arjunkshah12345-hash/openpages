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
  LayoutGrid,
  FileText,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/brand/mark";
import { toast } from "sonner";

type PageItem = { id: string; title: string; icon: string | null };
type SpaceInfo = {
  id: string;
  name: string;
  icon: string;
  description: string | null;
};

function initial(name: string) {
  return (name.trim()[0] || "S").toUpperCase();
}

/** Matches landing workspace rail */
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
        body: JSON.stringify({ spaceId: space.id, title: "Untitled" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create page");
      router.push(`/spaces/${space.id}/pages/${data.id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create page");
    } finally {
      setCreating(false);
    }
  };

  const deletePage = async (pageId: string, title: string) => {
    if (!window.confirm(`Delete “${title || "Untitled"}”? This can’t be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/pages/${pageId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Page deleted");
      if (pathname.includes(pageId)) {
        router.push(`/spaces/${space.id}`);
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete page");
    }
  };

  return (
    <aside className="op-rail flex h-full w-[248px] shrink-0 flex-col border-r border-[#e9e9e4]">
      <div className="flex items-center gap-2 px-3.5 pb-1 pt-4">
        <Link
          href="/spaces"
          className="op-mark flex items-center gap-1.5 text-[14px] text-[var(--ink)]"
        >
          <BrandMark size={18} />
          <span className="tracking-tight">OpenPages</span>
        </Link>
        <Link
          href="/spaces"
          className="ml-auto rounded-md p-1 text-[var(--ink-faint)] transition-colors hover:bg-white hover:text-[var(--ink)]"
          aria-label="All Spaces"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="px-3 pb-2 pt-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--ink-faint)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="h-8 rounded-lg border-transparent bg-transparent pl-8 text-[12px] tracking-normal shadow-none placeholder:text-[var(--ink-faint)] focus-visible:border-[var(--border)] focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="op-eyebrow mb-2 px-1.5">Your space</div>
        <div className="mb-1 flex items-center gap-2 px-1.5 py-1">
          <div className="grid size-5 place-items-center rounded border border-[#d4dcd3] bg-[#e4ece2] text-[10px] font-medium text-[#547149]">
            {initial(space.name)}
          </div>
          <span className="truncate text-[12px] font-medium tracking-tight text-[var(--ink)]">
            {space.name}
          </span>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-2">
        <NavLink
          href={`/spaces/${space.id}`}
          active={pathname === `/spaces/${space.id}`}
          icon={<LayoutGrid className="h-3.5 w-3.5" />}
        >
          Overview
        </NavLink>
        <NavLink
          href={`/spaces/${space.id}/agent`}
          active={pathname.includes("/agent")}
          icon={<MessageSquare className="h-3.5 w-3.5" />}
        >
          Chat
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

      <div className="mt-5 flex items-center justify-between px-4 pb-1.5">
        <span className="op-eyebrow">Pages</span>
        <button
          type="button"
          onClick={createPage}
          disabled={creating}
          className="rounded-md p-1 text-[var(--ink-faint)] transition-colors hover:bg-white hover:text-[var(--ink)]"
          aria-label="New page"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {filtered.map((page) => {
          const href = `/spaces/${space.id}/pages/${page.id}`;
          const active = pathname === href;
          return (
            <div
              key={page.id}
              className={cn(
                "group mb-0.5 flex items-center gap-0.5 rounded-[6px]",
                active ? "op-nav-active" : "hover:bg-[#eeeee8]"
              )}
            >
              <Link
                href={href}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-[12.5px] tracking-normal",
                  active ? "text-[#30352b]" : "op-nav-idle"
                )}
              >
                <FileText
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    active ? "text-[#30352b]" : "text-[var(--ink-faint)]"
                  )}
                />
                <span className="truncate">{page.title}</span>
              </Link>
              <button
                type="button"
                aria-label={`Delete ${page.title}`}
                className="mr-1 rounded p-1 text-[var(--ink-faint)] opacity-0 transition group-hover:opacity-100 hover:bg-white hover:text-red-600"
                onClick={() => void deletePage(page.id, page.title)}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-2 py-8 text-center text-[11px] text-[var(--ink-faint)]">
            No pages yet
          </div>
        )}
      </div>

      <div className="border-t border-[#e9e9e4] p-2.5">
        <Button
          size="sm"
          className="h-8 w-full text-[12px] tracking-normal"
          onClick={() => router.push(`/spaces/${space.id}/agent`)}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Message Space
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
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-[6px] px-2 py-2 text-[12.5px] tracking-normal transition-colors",
        active ? "op-nav-active" : "op-nav-idle"
      )}
    >
      <span className={active ? "text-[#30352b]" : "text-[var(--ink-faint)]"}>
        {icon}
      </span>
      {children}
    </Link>
  );
}

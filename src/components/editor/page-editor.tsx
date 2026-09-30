"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code2,
  Quote,
  Heading1,
  Heading2,
  Table as TableIcon,
  CheckSquare,
  Sparkles,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  pageId: string;
  initialContent: JSONContent;
  initialTitle: string;
  onTitleChange?: (title: string) => void;
  onSaveState?: (state: "idle" | "saving" | "saved") => void;
};

const INLINE_ACTIONS = [
  { id: "rewrite", label: "Rewrite" },
  { id: "improve", label: "Improve" },
  { id: "shorten", label: "Shorten" },
  { id: "expand", label: "Expand" },
  { id: "explain", label: "Explain" },
  { id: "table", label: "Turn into table" },
] as const;

export function PageEditor({
  pageId,
  initialContent,
  initialTitle,
  onTitleChange,
  onSaveState,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [slashOpen, setSlashOpen] = useState(false);
  const [proposal, setProposal] = useState<{
    original: string;
    proposed: string;
    from: number;
    to: number;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);

  const save = useCallback(
    async (nextTitle: string, content: JSONContent, text: string) => {
      onSaveState?.("saving");
      try {
        await fetch(`/api/pages/${pageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: nextTitle,
            content,
            contentText: text,
            actorType: "user",
          }),
        });
        onSaveState?.("saved");
      } catch {
        onSaveState?.("idle");
      }
    },
    [pageId, onSaveState]
  );

  const scheduleSave = useCallback(
    (editor: ReturnType<typeof useEditor>) => {
      if (!editor) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        save(titleRef.current, editor.getJSON(), editor.getText());
      }, 600);
    },
    [save]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands, or start writing…",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose-openpages min-h-[60vh] focus:outline-none px-1 pb-24",
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "/") {
          setSlashOpen(true);
        } else if (event.key === "Escape") {
          setSlashOpen(false);
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      scheduleSave(ed);
      const { from } = ed.state.selection;
      const textBefore = ed.state.doc.textBetween(Math.max(0, from - 1), from);
      if (textBefore !== "/") setSlashOpen(false);
    },
  });

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const runInlineAi = async (action: string) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to);
    if (!selected.trim()) return;

    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/inline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text: selected, pageId }),
      });
      const data = await res.json();
      if (data.proposed) {
        setProposal({
          original: selected,
          proposed: data.proposed,
          from,
          to,
        });
      }
    } finally {
      setAiLoading(false);
    }
  };

  const acceptProposal = () => {
    if (!editor || !proposal) return;
    editor
      .chain()
      .focus()
      .insertContentAt(
        { from: proposal.from, to: proposal.to },
        proposal.proposed
      )
      .run();
    setProposal(null);
    scheduleSave(editor);
  };

  const insertCommand = (cmd: string) => {
    if (!editor) return;
    const { from } = editor.state.selection;
    // remove the "/" character
    editor.chain().focus().deleteRange({ from: from - 1, to: from }).run();

    switch (cmd) {
      case "heading":
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case "table":
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
        break;
      case "code":
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case "checklist":
        editor.chain().focus().toggleTaskList().run();
        break;
      case "quote":
        editor.chain().focus().toggleBlockquote().run();
        break;
      case "diagram":
        editor
          .chain()
          .focus()
          .insertContent({
            type: "codeBlock",
            attrs: { language: "mermaid" },
            content: [
              {
                type: "text",
                text: "flowchart LR\n  A[Human] --> B[Space]\n  B --> C[Agent]\n  C --> D[SuperCompress]\n  D --> E[Model]",
              },
            ],
          })
          .run();
        break;
      case "ai":
        editor
          .chain()
          .focus()
          .insertContent("Ask the workspace agent about this page…")
          .run();
        break;
      default:
        break;
    }
    setSlashOpen(false);
  };

  const hasSelection =
    editor &&
    editor.state.selection.from !== editor.state.selection.to;

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          onTitleChange?.(e.target.value);
          titleRef.current = e.target.value;
          if (editor) scheduleSave(editor);
        }}
        className="w-full bg-transparent text-4xl font-semibold tracking-tight text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none mb-6 font-[family-name:var(--font-display)]"
        placeholder="Untitled"
      />

      {editor && (
        <div className="sticky top-0 z-10 -mx-2 mb-4 flex flex-wrap items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--paper)]/95 px-1.5 py-1 backdrop-blur">
          <ToolbarBtn
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <CheckSquare className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            <TableIcon className="h-4 w-4" />
          </ToolbarBtn>

          {hasSelection && (
            <>
              <div className="mx-1 h-4 w-px bg-[var(--border)]" />
              <div className="flex items-center gap-1 px-1">
                <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
                {INLINE_ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    disabled={aiLoading}
                    onClick={() => runInlineAi(a.id)}
                    className="rounded px-1.5 py-0.5 text-[11px] text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)] disabled:opacity-50"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <EditorContent editor={editor} />

      {slashOpen && (
        <div className="absolute left-4 z-20 w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--paper)] shadow-xl">
          <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-[var(--ink-faint)]">
            Commands
          </div>
          {[
            { id: "ai", label: "Ask AI", icon: Sparkles },
            { id: "heading", label: "Heading", icon: Heading1 },
            { id: "table", label: "Table", icon: TableIcon },
            { id: "code", label: "Code block", icon: Code2 },
            { id: "diagram", label: "Mermaid diagram", icon: Wand2 },
            { id: "checklist", label: "Checklist", icon: CheckSquare },
            { id: "quote", label: "Quote", icon: Quote },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => insertCommand(item.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--ink)] hover:bg-[var(--surface)]"
            >
              <item.icon className="h-4 w-4 text-[var(--ink-faint)]" />
              {item.label}
            </button>
          ))}
        </div>
      )}

      {proposal && (
        <div className="fixed bottom-6 left-1/2 z-30 w-full max-w-lg -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-4 shadow-2xl">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
            <Wand2 className="h-4 w-4 text-[var(--accent)]" />
            Proposed edit
          </div>
          <div className="mb-3 max-h-40 overflow-auto rounded-lg bg-[var(--surface)] p-3 text-sm text-[var(--ink-muted)] whitespace-pre-wrap">
            {proposal.proposed}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setProposal(null)}>
              Reject
            </Button>
            <Button variant="accent" size="sm" onClick={acceptProposal}>
              Accept
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md p-1.5 text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]",
        active && "bg-[var(--surface)] text-[var(--ink)]"
      )}
    >
      {children}
    </button>
  );
}

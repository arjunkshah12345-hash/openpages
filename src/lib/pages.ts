import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export { LOCAL_USER_ID } from "@/lib/db/seed";

export function tiptapDocFromMarkdown(markdown: string) {
  const lines = markdown.split("\n");
  const content: Record<string, unknown>[] = [];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      content.push({
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: line.slice(2) }],
      });
    } else if (line.startsWith("## ")) {
      content.push({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: line.slice(3) }],
      });
    } else if (line.startsWith("### ")) {
      content.push({
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: line.slice(4) }],
      });
    } else if (line.startsWith("- [ ] ") || line.startsWith("- [x] ")) {
      const checked = line.startsWith("- [x] ");
      content.push({
        type: "taskList",
        content: [
          {
            type: "taskItem",
            attrs: { checked },
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: line.slice(6) }],
              },
            ],
          },
        ],
      });
    } else if (line.startsWith("- ")) {
      content.push({
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: line.slice(2) }],
              },
            ],
          },
        ],
      });
    } else if (line.startsWith("> ")) {
      content.push({
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: line.slice(2) }],
          },
        ],
      });
    } else if (line.startsWith("```")) {
      // skip fence markers in simple conversion
      continue;
    } else if (!line.trim()) {
      content.push({ type: "paragraph" });
    } else {
      content.push({
        type: "paragraph",
        content: [{ type: "text", text: line }],
      });
    }
  }

  return { type: "doc", content };
}

export function extractTextFromTiptap(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  const parts: string[] = [];

  function walk(node: Record<string, unknown>) {
    if (node.text && typeof node.text === "string") {
      parts.push(node.text);
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child as Record<string, unknown>);
      }
      if (
        node.type === "paragraph" ||
        node.type === "heading" ||
        node.type === "listItem" ||
        node.type === "taskItem" ||
        node.type === "blockquote"
      ) {
        parts.push("\n");
      }
    }
  }

  walk(doc as Record<string, unknown>);
  return parts.join("").trim();
}

export async function createPage(options: {
  spaceId: string;
  title: string;
  contentText?: string;
  content?: Record<string, unknown>;
  icon?: string;
  createdBy?: string;
  actorType?: "user" | "agent" | "mcp";
}) {
  const db = await getDb();
  const id = nanoid();
  const now = new Date();
  const content =
    options.content ||
    tiptapDocFromMarkdown(options.contentText || `# ${options.title}\n\n`);
  const contentText =
    options.contentText || extractTextFromTiptap(content) || options.title;

  await db.insert(schema.pages).values({
    id,
    spaceId: options.spaceId,
    title: options.title,
    icon: options.icon || "📄",
    content,
    contentText,
    createdBy: options.createdBy || options.actorType || "user",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schema.pageVersions).values({
    id: nanoid(),
    pageId: id,
    title: options.title,
    content,
    contentText,
    actorType: options.actorType || "user",
    summary: "Created page",
    createdAt: now,
  });

  return { id, title: options.title, content, contentText };
}

export async function updatePage(options: {
  pageId: string;
  title?: string;
  content?: Record<string, unknown>;
  contentText?: string;
  icon?: string;
  actorType?: "user" | "agent" | "mcp";
  summary?: string;
}) {
  const db = await getDb();
  const existing = await db.query.pages.findFirst({
    where: eq(schema.pages.id, options.pageId),
  });
  if (!existing) throw new Error("Page not found");

  const now = new Date();
  const content = options.content ?? existing.content;
  const contentText =
    options.contentText ??
    (options.content ? extractTextFromTiptap(options.content) : existing.contentText);
  const title = options.title ?? existing.title;

  await db
    .update(schema.pages)
    .set({
      title,
      content,
      contentText,
      icon: options.icon ?? existing.icon,
      updatedAt: now,
    })
    .where(eq(schema.pages.id, options.pageId));

  await db.insert(schema.pageVersions).values({
    id: nanoid(),
    pageId: options.pageId,
    title,
    content,
    contentText,
    actorType: options.actorType || "user",
    summary: options.summary || "Updated page",
    createdAt: now,
  });

  return { id: options.pageId, title, content, contentText };
}

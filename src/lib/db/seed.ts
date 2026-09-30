import type Database from "better-sqlite3";
import { APP } from "@/lib/config";

const DEMO_USER = "user_local";
const DEMO_SPACE = "space_demo";

type SeedPage = { id: string; title: string; icon: string; text: string };

/**
 * Demo Space that makes SuperCompress tangible on first run:
 * enough page text that retrieval + compression produces visible savings.
 */
export function seedIfEmpty(db: Database.Database) {
  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get() as {
    c: number;
  };
  if (userCount.c > 0) return;

  const now = Date.now();

  db.prepare(
    `INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)`
  ).run(DEMO_USER, "Local User", "local@openpages.dev", now);

  db.prepare(
    `INSERT INTO spaces (id, name, icon, description, owner_id, settings, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    DEMO_SPACE,
    "Product Launch",
    "🚀",
    "Demo Space: humans + agents sharing memory. Every AI call runs through SuperCompress.",
    DEMO_USER,
    JSON.stringify({ defaultModel: APP.defaultModel }),
    now,
    now
  );

  db.prepare(
    `INSERT INTO space_members (id, space_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run("mem_1", DEMO_SPACE, DEMO_USER, "owner", now);

  const insertPage = db.prepare(
    `INSERT INTO pages (id, space_id, title, icon, content, content_text, sort_order, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  seedPages().forEach((page, i) => {
    insertPage.run(
      page.id,
      DEMO_SPACE,
      page.title,
      page.icon,
      JSON.stringify(markdownToDoc(page.text)),
      page.text,
      i,
      "user",
      now,
      now
    );
  });
}

function seedPages(): SeedPage[] {
  return [
    {
      id: "page_roadmap",
      title: "Product Roadmap",
      icon: "🗺️",
      text: `# Product Roadmap

## Why OpenPages exists
AI workspaces fail economically when every question ships the entire Space into the model.
OpenPages fixes that by making SuperCompress the context layer — not an optional plugin.

## Q2 Goals
- Ship OpenPages public beta
- Integrate SuperCompress into every AI call (chat, agent, MCP workspace_context)
- MCP server for Cursor / Claude Code / Codex
- Block-based collaborative editor with version history

## Milestones
1. **Alpha** — Spaces, Pages, chat (done)
2. **Beta** — Agent mode, context inspector, version history
3. **GA** — Self-host Docker, multiplayer, SSO

## Success metrics
- 70%+ average token savings via SuperCompress on real Spaces
- Sub-200ms page autosave
- Agents cite sources on every answer
- Context inspector visible on every turn

## Non-goals
- Becoming another closed SaaS workspace
- Sending full workspace dumps to models "just in case"
`,
    },
    {
      id: "page_launch",
      title: "Launch Notes",
      icon: "📝",
      text: `# Launch Notes

## Positioning
Your workspace, built for humans and agents.
Persistent context without persistent token costs.

## Narrative
OpenPages is partially a product and partially a living demo of SuperCompress:
workspaces can grow forever without context windows growing with them.

## Launch day checklist
- [ ] Blog post live
- [ ] Demo video on landing page showing SuperCompress before/after
- [ ] HN / Reddit posts scheduled
- [ ] Discord community open
- [ ] Docker image published

## Missing work
- Engineering: finalize MCP auth tokens
- Marketing: before/after SuperCompress animation
- Launch day: support rotation schedule

## Key message
Workspace can grow forever without your context window growing with it.
`,
    },
    {
      id: "page_feedback",
      title: "Customer Feedback",
      icon: "💬",
      text: `# Customer Feedback

## Themes
1. **Token costs** — teams hate dumping entire Notion workspaces into models
2. **Agent memory** — want shared persistent memory between humans and agents
3. **Citations** — need to know which page the answer came from
4. **Self-host** — enterprises require Docker + local models

## Quotes
> "We burned $400 last month just stuffing docs into Claude." — Series A eng manager
> "If agents could edit our pages with history, we'd switch tomorrow." — indie hacker
> "Show me the compression ratio or I won't trust the RAG." — platform lead

## Actions
- Surface SuperCompress savings on every chat turn
- Ship version history with actor attribution (user / agent / mcp)
- Keep the context inspector first-class, not buried in settings
`,
    },
    {
      id: "page_arch",
      title: "Architecture",
      icon: "🏗️",
      text: `# Architecture

## Pipeline (non-negotiable)

\`\`\`
Workspace → Retrieval → SuperCompress → Model
\`\`\`

The query is never compressed. Only candidate context is.

## Layers
1. **Storage** — SQLite (default) with page versions and files
2. **Retrieval** — query-aware ranking over pages, files, conversation
3. **Compression** — SuperCompress API (compiler mode) with local offline fallback
4. **Inference** — OpenAI, Anthropic, Gemini, OpenRouter, Ollama (provider-agnostic)
5. **MCP** — space_search, page_get/create/update, file_get, workspace_context

## Design principles
- Model-agnostic
- SuperCompress is infrastructure, not a plugin
- Open source and self-hostable
- Every AI response exposes token savings

## Code map
- \`src/lib/retrieval\` — find candidates
- \`src/lib/supercompress\` — compress candidates against the query
- \`src/lib/models\` — call the selected provider with compressed context only
`,
    },
    {
      id: "page_sc",
      title: "About SuperCompress",
      icon: "⚡",
      text: `# About SuperCompress

SuperCompress is query-aware context compression for AI applications and coding agents.

## What it does
1. Takes long context + the current query
2. Scores blocks by relevance to that query
3. Keeps entities, errors, definitions, and nearby dependencies in original wording
4. Returns a smaller prompt + token stats

## Why it matters for OpenPages
Without SuperCompress, a growing Space becomes an unbounded token bill.
With SuperCompress, OpenPages retrieves broadly, compresses tightly, and only then calls the model.

## Modes used here
- **Compiler** (default) — maximize tokens removed while preserving answer-critical evidence
- Local fallback — offline stand-in when \`SUPERCOMPRESS_API_KEY\` is unset

## Links
- Product: https://www.supercompress.dev
- Docs: https://docs.supercompress.dev
- Dashboard / API keys: https://www.supercompress.dev/dashboard
`,
    },
  ];
}

function markdownToDoc(markdown: string) {
  const content = markdown.split("\n").map((line) => {
    if (line.startsWith("# ")) {
      return {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: line.slice(2) }],
      };
    }
    if (line.startsWith("## ")) {
      return {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: line.slice(3) }],
      };
    }
    if (line.startsWith("- [ ] ")) {
      return {
        type: "taskList",
        content: [
          {
            type: "taskItem",
            attrs: { checked: false },
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: line.slice(6) }],
              },
            ],
          },
        ],
      };
    }
    if (line.startsWith("- ")) {
      return {
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
      };
    }
    if (line.startsWith("> ")) {
      return {
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: line.slice(2) }],
          },
        ],
      };
    }
    if (!line.trim()) return { type: "paragraph" };
    return {
      type: "paragraph",
      content: [{ type: "text", text: line }],
    };
  });

  return { type: "doc", content };
}

export { DEMO_SPACE, DEMO_USER, DEMO_USER as LOCAL_USER_ID };

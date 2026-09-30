# Architecture

OpenPages is an open-source workspace for humans and agents. Its differentiator is not “another editor” — it is **SuperCompress as infrastructure**.

```
┌─────────────┐     ┌────────────┐     ┌────────────────┐     ┌─────────┐
│  Workspace  │ ──▶ │ Retrieval  │ ──▶ │  SuperCompress │ ──▶ │  Model  │
│ pages/files │     │ query rank │     │ API or local   │     │ any LLM │
└─────────────┘     └────────────┘     └────────────────┘     └─────────┘
```

The **query is never compressed**. Only candidate context is.

---

## Request paths that must use the pipeline

| Surface | Entry | Pipeline |
|---------|--------|----------|
| Chat | `POST /api/chat` | `buildCompressedContext` → model |
| Agent mode | `POST /api/agent` | same, plus page mutations |
| MCP | `workspace_context` | retrieve + `compressContext` |
| Inline AI | `POST /api/ai/inline` | short selection transform (no Space dump) |

Chat and agent **must not** send raw Space text to the model. They call `buildCompressedContext` from `src/lib/supercompress/pipeline.ts`.

---

## Module map

```
src/
  lib/
    config.ts              # SuperCompress URLs, app copy, pipeline label
    supercompress/
      client.ts            # Hosted API + local query-aware fallback
      pipeline.ts          # Retrieval → compress → system prompt + ContextMeta
    retrieval/
      search.ts            # Rank pages / files / recent messages
    models/
      providers.ts         # OpenAI, Anthropic, Gemini, OpenRouter, Ollama
    ai/
      respond.ts           # generateWithPipeline + demo replies
    agent/
      launch-pages.ts      # Multi-step page drafts
    db/
      schema.ts            # Drizzle tables (incl. ContextMeta on messages/runs)
      migrate.ts           # SQLite DDL
      seed.ts              # Demo Space (SuperCompress narrative)
      index.ts             # Lazy DB singleton
  components/
    context/               # Context inspector (savings UI)
    agent/                 # Chat + agent timeline
    editor/                # Tiptap page editor
  app/api/                 # Thin HTTP adapters over lib/
  mcp/server.mjs           # Stdio MCP → /api/mcp
```

---

## SuperCompress client

`compressContext(context, query)`:

1. If `SUPERCOMPRESS_API_KEY` is set → `POST` hosted compress (`compiler` mode by default)
2. On failure / no key → **local** query-aware block scorer (offline stand-in)
3. Returns `CompressResult` with tokens, `%` saved, `source: "api" | "local"`, policy name

This result becomes `ContextMeta` on every assistant message and agent run so the UI can prove the value prop.

Docs: https://docs.supercompress.dev · Product: https://www.supercompress.dev

---

## Data model (SQLite)

- `spaces` / `space_members` / `pages` / `page_versions` / `files` / `page_links`
- `conversations` / `messages` (`context_meta` JSON = SuperCompress stats + sources)
- `agent_runs` (`steps` timeline + `context_meta`)

Versions track `actor_type`: `user` | `agent` | `mcp`.

Migrations run on first open (`migrate.ts`). Demo seed runs once (`seed.ts`).

---

## Design rules

1. **SuperCompress before providers** — never “model first, compress later.”
2. **Inspector is first-class** — every AI turn should be inspectable.
3. **Model-agnostic** — providers are swappable; the pipeline is not.
4. **Self-host first** — SQLite + Docker; no required cloud auth to try the product.
5. **No silent full-workspace dumps** — retrieval is always bounded, then compressed.

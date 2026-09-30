import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { searchSpace } from "@/lib/retrieval/search";
import { createPage, updatePage, tiptapDocFromMarkdown } from "@/lib/pages";
import { buildCompressedContext } from "@/lib/supercompress/pipeline";

/**
 * MCP HTTP bridge for external agents (Cursor, Claude Code, Codex, …).
 *
 * `workspace_context` always runs Retrieval → SuperCompress so clients
 * never pull an uncompressed Space dump by default.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const tool = body.tool || body.name || body.method;
  const args = body.arguments || body.params || body;

  try {
    switch (tool) {
      case "space_search": {
        const results = await searchSpace(
          args.spaceId,
          args.query || args.q || ""
        );
        return NextResponse.json({ ok: true, result: results });
      }
      case "page_list": {
        const db = getDb();
        const pages = await db
          .select({
            id: schema.pages.id,
            title: schema.pages.title,
            icon: schema.pages.icon,
            updatedAt: schema.pages.updatedAt,
          })
          .from(schema.pages)
          .where(eq(schema.pages.spaceId, args.spaceId));
        return NextResponse.json({ ok: true, result: pages });
      }
      case "page_get": {
        const db = getDb();
        const page = await db.query.pages.findFirst({
          where: eq(schema.pages.id, args.pageId || args.id),
        });
        if (!page) {
          return NextResponse.json(
            { ok: false, error: "Not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({
          ok: true,
          result: {
            id: page.id,
            title: page.title,
            icon: page.icon,
            contentText: page.contentText,
            content: page.content,
          },
        });
      }
      case "page_create": {
        const page = await createPage({
          spaceId: args.spaceId,
          title: args.title || "Untitled",
          contentText: args.contentText || args.content,
          icon: args.icon,
          actorType: "mcp",
        });
        return NextResponse.json({ ok: true, result: page });
      }
      case "page_update": {
        const content = args.contentText
          ? tiptapDocFromMarkdown(args.contentText)
          : args.content;
        const page = await updatePage({
          pageId: args.pageId || args.id,
          title: args.title,
          content,
          contentText: args.contentText,
          actorType: "mcp",
          summary: args.summary || "Updated via MCP",
        });
        return NextResponse.json({ ok: true, result: page });
      }
      case "file_get": {
        const db = getDb();
        const file = await db.query.files.findFirst({
          where: eq(schema.files.id, args.fileId || args.id),
        });
        if (!file) {
          return NextResponse.json(
            { ok: false, error: "Not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ ok: true, result: file });
      }
      case "workspace_context": {
        const pipeline = await buildCompressedContext({
          spaceId: args.spaceId,
          query: args.query || "overview",
        });
        return NextResponse.json({
          ok: true,
          result: {
            sources: pipeline.meta.sources,
            originalTokens: pipeline.meta.originalTokens,
            compressedTokens: pipeline.meta.compressedTokens,
            tokensSavedPct: pipeline.meta.tokensSavedPct,
            compressedContext: pipeline.meta.compressedContext,
            policyName: pipeline.meta.policyName,
            provider: pipeline.meta.provider,
            summary: pipeline.summary,
            pipeline: "Workspace → Retrieval → SuperCompress → Model",
            originalContext: args.includeOriginal
              ? pipeline.meta.originalContext
              : undefined,
          },
        });
      }
      case "tools/list":
      case "list_tools": {
        return NextResponse.json({
          ok: true,
          tools: [
            {
              name: "space_search",
              description: "Search pages and files in a Space",
            },
            { name: "page_list", description: "List pages in a Space" },
            { name: "page_get", description: "Get a page by id" },
            { name: "page_create", description: "Create a page (actor: mcp)" },
            { name: "page_update", description: "Update a page (actor: mcp)" },
            { name: "file_get", description: "Get a file by id" },
            {
              name: "workspace_context",
              description:
                "Retrieve Space context and compress it with SuperCompress for a query",
            },
          ],
        });
      }
      default:
        return NextResponse.json(
          { ok: false, error: `Unknown tool: ${tool}` },
          { status: 400 }
        );
    }
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: "openpages",
    version: "0.1.0",
    description:
      "OpenPages Space MCP bridge — workspace_context runs SuperCompress",
    pipeline: "Workspace → Retrieval → SuperCompress → Model",
    tools: [
      "space_search",
      "page_get",
      "page_create",
      "page_update",
      "page_list",
      "file_get",
      "workspace_context",
    ],
  });
}

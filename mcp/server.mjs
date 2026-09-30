#!/usr/bin/env node
/**
 * OpenPages MCP stdio server
 * Exposes a Space to Cursor, Claude Code, Codex, and other MCP clients.
 *
 * Usage:
 *   OPENPAGES_URL=http://localhost:3000 OPENPAGES_SPACE_ID=space_demo node mcp/server.mjs
 */

import { createInterface } from "readline";

const BASE = process.env.OPENPAGES_URL || "http://127.0.0.1:3000";
const DEFAULT_SPACE = process.env.OPENPAGES_SPACE_ID || "space_demo";

const TOOLS = [
  {
    name: "space_search",
    description: "Search pages and files in the OpenPages Space",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        spaceId: { type: "string" },
      },
      required: ["query"],
    },
  },
  {
    name: "page_list",
    description: "List all pages in the Space",
    inputSchema: {
      type: "object",
      properties: { spaceId: { type: "string" } },
    },
  },
  {
    name: "page_get",
    description: "Get a page by id",
    inputSchema: {
      type: "object",
      properties: { pageId: { type: "string" } },
      required: ["pageId"],
    },
  },
  {
    name: "page_create",
    description: "Create a new page",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        contentText: { type: "string" },
        spaceId: { type: "string" },
      },
      required: ["title"],
    },
  },
  {
    name: "page_update",
    description: "Update a page",
    inputSchema: {
      type: "object",
      properties: {
        pageId: { type: "string" },
        title: { type: "string" },
        contentText: { type: "string" },
      },
      required: ["pageId"],
    },
  },
  {
    name: "file_get",
    description: "Get an uploaded file",
    inputSchema: {
      type: "object",
      properties: { fileId: { type: "string" } },
      required: ["fileId"],
    },
  },
  {
    name: "workspace_context",
    description:
      "Retrieve relevant Space context and compress it with SuperCompress",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        spaceId: { type: "string" },
      },
      required: ["query"],
    },
  },
];

async function callTool(name, args) {
  const payload = {
    tool: name,
    arguments: {
      spaceId: args.spaceId || DEFAULT_SPACE,
      ...args,
    },
  };
  const res = await fetch(`${BASE}/api/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

const rl = createInterface({ input: process.stdin, terminal: false });

rl.on("line", async (line) => {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }

  const { id, method, params } = msg;

  if (method === "initialize") {
    send({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "openpages", version: "0.1.0" },
      },
    });
    return;
  }

  if (method === "notifications/initialized") return;

  if (method === "tools/list") {
    send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    return;
  }

  if (method === "tools/call") {
    try {
      const result = await callTool(params.name, params.arguments || {});
      send({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      });
    } catch (e) {
      send({
        jsonrpc: "2.0",
        id,
        error: { code: -32000, message: String(e.message || e) },
      });
    }
    return;
  }

  if (id != null) {
    send({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  }
});

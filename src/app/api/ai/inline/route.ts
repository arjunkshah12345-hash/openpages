import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getLanguageModel, hasAnyModelKey } from "@/lib/models/providers";

const PROMPTS: Record<string, string> = {
  rewrite: "Rewrite the following text more clearly, keeping the same meaning:",
  improve: "Improve the writing quality of the following text:",
  shorten: "Shorten the following text while keeping key points:",
  expand: "Expand the following text with useful detail:",
  explain: "Explain the following text in plain language:",
  table: "Convert the following text into a markdown table:",
  diagram: "Convert the following into a mermaid flowchart:",
  ask: "Answer based on this selected text:",
};

export async function POST(req: Request) {
  const body = await req.json();
  const action = (body.action as string) || "improve";
  const text = body.text as string;

  if (!text?.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const instruction = PROMPTS[action] || PROMPTS.improve;

  if (!hasAnyModelKey()) {
    return NextResponse.json({
      proposed: localTransform(action, text),
      demo: true,
    });
  }

  try {
    const result = await generateText({
      model: getLanguageModel(body.model || "openai/gpt-4o-mini"),
      prompt: `${instruction}\n\n"""${text}"""\n\nReturn only the result, no preamble.`,
    });
    return NextResponse.json({ proposed: result.text.trim() });
  } catch {
    return NextResponse.json({
      proposed: localTransform(action, text),
      demo: true,
    });
  }
}

function localTransform(action: string, text: string): string {
  switch (action) {
    case "shorten":
      return text.split(/[.!?]/).filter(Boolean).slice(0, 2).join(". ").trim() + ".";
    case "expand":
      return `${text}\n\nIn more detail: this point matters because it connects directly to how the Space shares memory between humans and agents — and why SuperCompress keeps inference costs flat as context grows.`;
    case "table": {
      const lines = text
        .split("\n")
        .map((l) => l.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean);
      const rows = lines
        .map((l, i) => `| ${i + 1} | ${l} |`)
        .join("\n");
      return `| # | Item |\n|---|------|\n${rows}`;
    }
    case "explain":
      return `Plainly: ${text}`;
    case "diagram":
      return "```mermaid\nflowchart LR\n  A[Selected text] --> B[Insight]\n```";
    default:
      return text
        .replace(/\s+/g, " ")
        .replace(/\b(very|really|just|actually)\b/gi, "")
        .trim();
  }
}

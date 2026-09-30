import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

export type ModelProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "openrouter"
  | "ollama";

export type ModelOption = {
  id: string;
  label: string;
  provider: ModelProvider;
};

export const MODEL_OPTIONS: ModelOption[] = [
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini", provider: "openai" },
  { id: "openai/gpt-4o", label: "GPT-4o", provider: "openai" },
  { id: "anthropic/claude-sonnet-4-5", label: "Claude Sonnet 4.5", provider: "anthropic" },
  { id: "anthropic/claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "anthropic" },
  { id: "gemini/gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "gemini" },
  { id: "openrouter/auto", label: "OpenRouter Auto", provider: "openrouter" },
  { id: "ollama/llama3.2", label: "Ollama Llama 3.2", provider: "ollama" },
];

export function parseModelId(modelId: string): {
  provider: ModelProvider;
  model: string;
} {
  const [provider, ...rest] = modelId.split("/");
  const model = rest.join("/") || provider;
  const known: ModelProvider[] = [
    "openai",
    "anthropic",
    "gemini",
    "openrouter",
    "ollama",
  ];
  if (known.includes(provider as ModelProvider)) {
    return { provider: provider as ModelProvider, model };
  }
  return { provider: "openai", model: modelId };
}

/**
 * Resolve a LanguageModel from a provider/model string.
 * Pipeline: Workspace → Retrieval → SuperCompress → Model
 */
export function getLanguageModel(modelId: string): LanguageModel {
  const { provider, model } = parseModelId(modelId);

  switch (provider) {
    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      return anthropic(model);
    }
    case "gemini": {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
      });
      return google(model);
    }
    case "openrouter": {
      const openrouter = createOpenAICompatible({
        name: "openrouter",
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
      });
      return openrouter(model === "auto" ? "openrouter/auto" : model);
    }
    case "ollama": {
      const ollama = createOpenAICompatible({
        name: "ollama",
        apiKey: "ollama",
        baseURL: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1",
      });
      return ollama(model);
    }
    case "openai":
    default: {
      // Prefer AI Gateway if configured
      if (process.env.AI_GATEWAY_API_KEY) {
        const gateway = createOpenAI({
          apiKey: process.env.AI_GATEWAY_API_KEY,
          baseURL: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
        });
        return gateway(model);
      }
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      return openai(model);
    }
  }
}

export function hasAnyModelKey(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.AI_GATEWAY_API_KEY ||
      process.env.OLLAMA_BASE_URL
  );
}

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { loadSettings } from "@/lib/settings/store";
import type { ProviderId } from "@/lib/settings/types";
import {
  MODEL_OPTIONS,
  PROVIDER_CATALOG,
  parseModelId,
  type ModelOption,
  type ModelProvider,
} from "./catalog";

export {
  MODEL_OPTIONS,
  PROVIDER_CATALOG,
  parseModelId,
  type ModelOption,
  type ModelProvider,
};

function cred(id: ProviderId) {
  return loadSettings().providers[id];
}

function firstKey(...vals: Array<string | undefined>): string | undefined {
  for (const v of vals) {
    if (v && v.trim()) return v.trim();
  }
  return undefined;
}

function compatible(
  name: string,
  apiKey: string | undefined,
  baseURL: string
) {
  return createOpenAICompatible({
    name,
    apiKey: apiKey || "not-needed",
    baseURL,
  });
}

/**
 * Resolve a LanguageModel from a provider/model string.
 * Pipeline: Workspace → Retrieval → SuperCompress → Model
 *
 * Credentials: ~/.openpages/settings.json first, then process.env.
 * ChatGPT provider uses Codex session tokens (no sk- API key).
 *
 * Server-only — do not import this module from client components.
 * Clients should import MODEL_OPTIONS from `@/lib/models/catalog`.
 */
export function getLanguageModel(modelId: string): LanguageModel {
  const { provider, model } = parseModelId(modelId);
  const settings = loadSettings();

  switch (provider) {
    case "anthropic": {
      const apiKey = firstKey(cred("anthropic")?.apiKey, process.env.ANTHROPIC_API_KEY);
      return createAnthropic({ apiKey })(model);
    }
    case "gemini": {
      const apiKey = firstKey(
        cred("gemini")?.apiKey,
        process.env.GOOGLE_API_KEY,
        process.env.GEMINI_API_KEY
      );
      return createGoogleGenerativeAI({ apiKey })(model);
    }
    case "openrouter": {
      const c = cred("openrouter");
      return compatible(
        "openrouter",
        firstKey(c?.apiKey, process.env.OPENROUTER_API_KEY),
        c?.baseUrl || "https://openrouter.ai/api/v1"
      )(model === "auto" ? "openrouter/auto" : model);
    }
    case "groq": {
      const c = cred("groq");
      return compatible(
        "groq",
        firstKey(c?.apiKey, process.env.GROQ_API_KEY),
        c?.baseUrl || "https://api.groq.com/openai/v1"
      )(model);
    }
    case "mistral": {
      const c = cred("mistral");
      return compatible(
        "mistral",
        firstKey(c?.apiKey, process.env.MISTRAL_API_KEY),
        c?.baseUrl || "https://api.mistral.ai/v1"
      )(model);
    }
    case "deepseek": {
      const c = cred("deepseek");
      return compatible(
        "deepseek",
        firstKey(c?.apiKey, process.env.DEEPSEEK_API_KEY),
        c?.baseUrl || "https://api.deepseek.com/v1"
      )(model);
    }
    case "together": {
      const c = cred("together");
      return compatible(
        "together",
        firstKey(c?.apiKey, process.env.TOGETHER_API_KEY),
        c?.baseUrl || "https://api.together.xyz/v1"
      )(model);
    }
    case "fireworks": {
      const c = cred("fireworks");
      return compatible(
        "fireworks",
        firstKey(c?.apiKey, process.env.FIREWORKS_API_KEY),
        c?.baseUrl || "https://api.fireworks.ai/inference/v1"
      )(model);
    }
    case "xai": {
      const c = cred("xai");
      return compatible(
        "xai",
        firstKey(c?.apiKey, process.env.XAI_API_KEY),
        c?.baseUrl || "https://api.x.ai/v1"
      )(model);
    }
    case "azure": {
      const c = cred("azure");
      const base =
        c?.baseUrl ||
        process.env.AZURE_OPENAI_ENDPOINT ||
        "https://YOUR_RESOURCE.openai.azure.com/openai/deployments";
      const deployment = c?.azureDeployment || model;
      const apiVersion =
        c?.azureApiVersion ||
        process.env.AZURE_OPENAI_API_VERSION ||
        "2024-08-01-preview";
      return compatible(
        "azure",
        firstKey(c?.apiKey, process.env.AZURE_OPENAI_API_KEY),
        `${base.replace(/\/$/, "")}/${deployment}?api-version=${apiVersion}`
      )(deployment);
    }
    case "ollama": {
      const c = cred("ollama");
      return compatible(
        "ollama",
        "ollama",
        c?.baseUrl || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1"
      )(model);
    }
    case "custom": {
      const c = cred("custom");
      if (!c?.baseUrl) {
        throw new Error("Custom provider needs a base URL in settings.");
      }
      return compatible("custom", c.apiKey, c.baseUrl)(
        model === "default" ? "gpt-4o-mini" : model
      );
    }
    case "chatgpt": {
      const cg = settings.chatgpt;
      if (!cg?.accessToken) {
        throw new Error(
          "ChatGPT is not connected. Finish onboarding or import Codex auth."
        );
      }
      const headers: Record<string, string> = {};
      if (cg.accountId) headers["ChatGPT-Account-ID"] = cg.accountId;
      return createOpenAI({
        apiKey: cg.accessToken,
        headers,
      })(model);
    }
    case "openai":
    default: {
      const openaiCred = cred("openai");
      const apiKey = firstKey(
        openaiCred?.apiKey,
        process.env.OPENAI_API_KEY,
        process.env.AI_GATEWAY_API_KEY
      );

      if (!apiKey && settings.chatgpt?.accessToken) {
        const headers: Record<string, string> = {};
        if (settings.chatgpt.accountId) {
          headers["ChatGPT-Account-ID"] = settings.chatgpt.accountId;
        }
        return createOpenAI({
          apiKey: settings.chatgpt.accessToken,
          headers,
        })(model);
      }

      if (
        process.env.AI_GATEWAY_API_KEY &&
        !openaiCred?.apiKey &&
        !process.env.OPENAI_API_KEY
      ) {
        return createOpenAI({
          apiKey: process.env.AI_GATEWAY_API_KEY,
          baseURL:
            process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
        })(model);
      }

      return createOpenAI({
        apiKey,
        baseURL: openaiCred?.baseUrl,
      })(model);
    }
  }
}

export function hasAnyModelKey(): boolean {
  const s = loadSettings();
  if (s.chatgpt?.accessToken) return true;
  const keys = [
    s.providers.openai?.apiKey,
    s.providers.anthropic?.apiKey,
    s.providers.gemini?.apiKey,
    s.providers.openrouter?.apiKey,
    s.providers.groq?.apiKey,
    s.providers.mistral?.apiKey,
    s.providers.deepseek?.apiKey,
    s.providers.together?.apiKey,
    s.providers.fireworks?.apiKey,
    s.providers.xai?.apiKey,
    s.providers.azure?.apiKey,
    s.providers.custom?.apiKey,
    process.env.OPENAI_API_KEY,
    process.env.ANTHROPIC_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GEMINI_API_KEY,
    process.env.OPENROUTER_API_KEY,
    process.env.GROQ_API_KEY,
    process.env.MISTRAL_API_KEY,
    process.env.DEEPSEEK_API_KEY,
    process.env.TOGETHER_API_KEY,
    process.env.FIREWORKS_API_KEY,
    process.env.XAI_API_KEY,
    process.env.AZURE_OPENAI_API_KEY,
    process.env.AI_GATEWAY_API_KEY,
    process.env.OLLAMA_BASE_URL,
  ];
  if (keys.some((k) => k && String(k).trim())) return true;
  return Boolean(s.providers.ollama);
}

export function hasProviderConfigured(id: ProviderId): boolean {
  const s = loadSettings();
  if (id === "chatgpt" || id === "openai") {
    if (s.chatgpt?.accessToken) return true;
  }
  if (id === "ollama") return true;
  const c = s.providers[id];
  if (c?.apiKey) return true;
  switch (id) {
    case "openai":
      return Boolean(process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY);
    case "anthropic":
      return Boolean(process.env.ANTHROPIC_API_KEY);
    case "gemini":
      return Boolean(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
    case "openrouter":
      return Boolean(process.env.OPENROUTER_API_KEY);
    case "groq":
      return Boolean(process.env.GROQ_API_KEY);
    case "mistral":
      return Boolean(process.env.MISTRAL_API_KEY);
    case "deepseek":
      return Boolean(process.env.DEEPSEEK_API_KEY);
    case "together":
      return Boolean(process.env.TOGETHER_API_KEY);
    case "fireworks":
      return Boolean(process.env.FIREWORKS_API_KEY);
    case "xai":
      return Boolean(process.env.XAI_API_KEY);
    case "azure":
      return Boolean(process.env.AZURE_OPENAI_API_KEY);
    case "custom":
      return Boolean(c?.baseUrl && c?.apiKey);
    default:
      return false;
  }
}

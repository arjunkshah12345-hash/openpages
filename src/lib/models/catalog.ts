import type { ProviderId } from "@/lib/settings/types";

export type ModelProvider = ProviderId;

export type ModelOption = {
  id: string;
  label: string;
  provider: ModelProvider;
  note?: string;
  /** Shown as a small pill — e.g. Fast, Flagship */
  badge?: string;
};

export type ProviderCatalogEntry = {
  id: ProviderId;
  label: string;
  blurb: string;
  docsUrl?: string;
  keyLabel?: string;
  keyPlaceholder?: string;
  defaultBaseUrl?: string;
  needsKey: boolean;
  openaiCompatible?: boolean;
  /** Featured in the primary BYOI chooser */
  featured?: boolean;
};

export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    blurb: "Sign in with your Plus / Pro / Team plan — no API key.",
    docsUrl: "https://github.com/opencoredev/login-with-chatgpt",
    needsKey: false,
    keyLabel: "Sign in (no API key)",
    featured: true,
  },
  {
    id: "openai",
    label: "OpenAI API",
    blurb: "Platform API key (sk-…). Pay-as-you-go billing.",
    docsUrl: "https://platform.openai.com/api-keys",
    needsKey: true,
    keyLabel: "OPENAI_API_KEY",
    keyPlaceholder: "sk-…",
    featured: true,
  },
  {
    id: "anthropic",
    label: "Anthropic",
    blurb: "Claude models via API key.",
    docsUrl: "https://console.anthropic.com/",
    needsKey: true,
    keyLabel: "ANTHROPIC_API_KEY",
    keyPlaceholder: "sk-ant-…",
    featured: true,
  },
  {
    id: "ollama",
    label: "Ollama",
    blurb: "Run models locally. No key required.",
    docsUrl: "https://ollama.com",
    needsKey: false,
    defaultBaseUrl: "http://127.0.0.1:11434/v1",
    openaiCompatible: true,
    featured: true,
  },
  {
    id: "gemini",
    label: "Google Gemini",
    blurb: "Gemini via Google AI Studio.",
    docsUrl: "https://aistudio.google.com/apikey",
    needsKey: true,
    keyLabel: "GOOGLE_API_KEY",
    keyPlaceholder: "AIza…",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    blurb: "One key, many models.",
    docsUrl: "https://openrouter.ai/keys",
    needsKey: true,
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    openaiCompatible: true,
    keyLabel: "OPENROUTER_API_KEY",
    keyPlaceholder: "sk-or-…",
  },
  {
    id: "groq",
    label: "Groq",
    blurb: "Fast open-weight inference.",
    docsUrl: "https://console.groq.com/keys",
    needsKey: true,
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    openaiCompatible: true,
    keyLabel: "GROQ_API_KEY",
  },
  {
    id: "mistral",
    label: "Mistral",
    blurb: "Mistral Large and friends.",
    docsUrl: "https://console.mistral.ai/",
    needsKey: true,
    defaultBaseUrl: "https://api.mistral.ai/v1",
    openaiCompatible: true,
    keyLabel: "MISTRAL_API_KEY",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    blurb: "Strong coding / reasoning value.",
    docsUrl: "https://platform.deepseek.com/",
    needsKey: true,
    defaultBaseUrl: "https://api.deepseek.com/v1",
    openaiCompatible: true,
    keyLabel: "DEEPSEEK_API_KEY",
  },
  {
    id: "together",
    label: "Together AI",
    blurb: "Open models at scale.",
    docsUrl: "https://api.together.xyz/",
    needsKey: true,
    defaultBaseUrl: "https://api.together.xyz/v1",
    openaiCompatible: true,
    keyLabel: "TOGETHER_API_KEY",
  },
  {
    id: "fireworks",
    label: "Fireworks",
    blurb: "Low-latency open models.",
    docsUrl: "https://fireworks.ai/",
    needsKey: true,
    defaultBaseUrl: "https://api.fireworks.ai/inference/v1",
    openaiCompatible: true,
    keyLabel: "FIREWORKS_API_KEY",
  },
  {
    id: "xai",
    label: "xAI (Grok)",
    blurb: "Grok via xAI API.",
    docsUrl: "https://console.x.ai/",
    needsKey: true,
    defaultBaseUrl: "https://api.x.ai/v1",
    openaiCompatible: true,
    keyLabel: "XAI_API_KEY",
  },
  {
    id: "azure",
    label: "Azure OpenAI",
    blurb: "Enterprise OpenAI deployments.",
    docsUrl: "https://portal.azure.com/",
    needsKey: true,
    openaiCompatible: true,
    keyLabel: "AZURE_OPENAI_API_KEY",
  },
  {
    id: "custom",
    label: "Custom OpenAI-compatible",
    blurb: "Any /v1 chat-completions endpoint.",
    needsKey: true,
    openaiCompatible: true,
    keyLabel: "API key",
    keyPlaceholder: "optional",
  },
];

export const MODEL_OPTIONS: ModelOption[] = [
  // ChatGPT account (subscription) — prefer these after Login with ChatGPT
  {
    id: "chatgpt/gpt-5.4",
    label: "GPT-5.4",
    provider: "chatgpt",
    badge: "Flagship",
    note: "ChatGPT plan · latest",
  },
  {
    id: "chatgpt/gpt-5.4-mini",
    label: "GPT-5.4 mini",
    provider: "chatgpt",
    badge: "Fast",
    note: "ChatGPT plan",
  },
  {
    id: "chatgpt/gpt-5.5",
    label: "GPT-5.5",
    provider: "chatgpt",
    note: "When available on your plan",
  },
  {
    id: "chatgpt/gpt-4o",
    label: "GPT-4o",
    provider: "chatgpt",
  },
  {
    id: "chatgpt/gpt-4o-mini",
    label: "GPT-4o mini",
    provider: "chatgpt",
    badge: "Cheap",
  },
  {
    id: "chatgpt/o3",
    label: "o3",
    provider: "chatgpt",
    badge: "Reasoning",
  },
  {
    id: "chatgpt/o4-mini",
    label: "o4-mini",
    provider: "chatgpt",
    badge: "Reasoning",
  },

  // OpenAI Platform API
  {
    id: "openai/gpt-5.4",
    label: "GPT-5.4",
    provider: "openai",
    badge: "Flagship",
  },
  {
    id: "openai/gpt-5.4-mini",
    label: "GPT-5.4 mini",
    provider: "openai",
    badge: "Fast",
  },
  {
    id: "openai/gpt-4.1",
    label: "GPT-4.1",
    provider: "openai",
  },
  {
    id: "openai/gpt-4.1-mini",
    label: "GPT-4.1 mini",
    provider: "openai",
    badge: "Cheap",
  },
  {
    id: "openai/gpt-4o",
    label: "GPT-4o",
    provider: "openai",
  },
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o mini",
    provider: "openai",
    badge: "Cheap",
  },
  {
    id: "openai/o3",
    label: "o3",
    provider: "openai",
    badge: "Reasoning",
  },
  {
    id: "openai/o3-mini",
    label: "o3-mini",
    provider: "openai",
    badge: "Reasoning",
  },
  {
    id: "openai/o4-mini",
    label: "o4-mini",
    provider: "openai",
    badge: "Reasoning",
  },

  // Anthropic
  {
    id: "anthropic/claude-sonnet-4-5",
    label: "Claude Sonnet 4.5",
    provider: "anthropic",
    badge: "Flagship",
  },
  {
    id: "anthropic/claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    badge: "Fast",
  },
  {
    id: "anthropic/claude-opus-4-5",
    label: "Claude Opus 4.5",
    provider: "anthropic",
  },

  // Gemini
  { id: "gemini/gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "gemini", badge: "Fast" },
  { id: "gemini/gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "gemini", badge: "Flagship" },

  // OpenRouter / Groq / etc.
  { id: "openrouter/auto", label: "OpenRouter Auto", provider: "openrouter", badge: "Smart" },
  {
    id: "openrouter/anthropic/claude-sonnet-4",
    label: "Claude Sonnet (via OR)",
    provider: "openrouter",
  },
  { id: "groq/llama-3.3-70b-versatile", label: "Llama 3.3 70B", provider: "groq", badge: "Fast" },
  { id: "mistral/mistral-large-latest", label: "Mistral Large", provider: "mistral" },
  { id: "deepseek/deepseek-chat", label: "DeepSeek Chat", provider: "deepseek" },
  {
    id: "together/meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    label: "Llama 3.1 70B",
    provider: "together",
  },
  {
    id: "fireworks/accounts/fireworks/models/llama-v3p1-70b-instruct",
    label: "Llama 3.1 70B",
    provider: "fireworks",
  },
  { id: "xai/grok-2-latest", label: "Grok 2", provider: "xai" },
  { id: "ollama/llama3.2", label: "Llama 3.2", provider: "ollama" },
  { id: "ollama/qwen2.5", label: "Qwen 2.5", provider: "ollama" },
  { id: "ollama/mistral", label: "Mistral", provider: "ollama" },
  { id: "custom/default", label: "Custom endpoint default", provider: "custom" },
];

const KNOWN: ProviderId[] = PROVIDER_CATALOG.map((p) => p.id);

export function parseModelId(modelId: string): {
  provider: ModelProvider;
  model: string;
} {
  const [provider, ...rest] = modelId.split("/");
  const model = rest.join("/") || provider;
  if (KNOWN.includes(provider as ProviderId)) {
    return { provider: provider as ModelProvider, model };
  }
  return { provider: "openai", model: modelId };
}

export function modelsForProvider(provider: ProviderId): ModelOption[] {
  return MODEL_OPTIONS.filter((m) => m.provider === provider);
}

export function defaultModelForProvider(provider: ProviderId): string {
  const listed = modelsForProvider(provider);
  if (listed[0]) return listed[0].id;
  return `${provider}/default`;
}

export function featuredProviders(): ProviderCatalogEntry[] {
  return PROVIDER_CATALOG.filter((p) => p.featured);
}

export function moreProviders(): ProviderCatalogEntry[] {
  return PROVIDER_CATALOG.filter((p) => !p.featured);
}

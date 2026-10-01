/**
 * Local OpenPages settings — credentials live on the machine that runs the app.
 * File: ~/.openpages/settings.json (override with OPENPAGES_SETTINGS_PATH).
 */

export type ProviderId =
  | "openai"
  | "chatgpt"
  | "anthropic"
  | "gemini"
  | "openrouter"
  | "ollama"
  | "groq"
  | "mistral"
  | "deepseek"
  | "together"
  | "fireworks"
  | "xai"
  | "azure"
  | "custom";

export type ChatGptAuth = {
  /** ChatGPT / Codex access token (not a sk- API key) */
  accessToken: string;
  refreshToken?: string;
  accountId?: string;
  /** Where the tokens came from */
  source: "import" | "device" | "manual";
  lastRefresh?: string;
};

export type ProviderCredential = {
  /** API key / bearer token (empty when using ChatGPT auth for openai) */
  apiKey?: string;
  /** Optional OpenAI-compatible base URL */
  baseUrl?: string;
  /** Azure OpenAI deployment / resource extras */
  azureDeployment?: string;
  azureApiVersion?: string;
  enabled?: boolean;
};

export type SuperCompressSettings = {
  apiKey: string;
  apiUrl?: string;
  /** Skip hosted API and always use local compressor */
  forceLocal?: boolean;
};

export type OpenPagesSettings = {
  version: 1;
  onboardingComplete: boolean;
  supercompress: SuperCompressSettings;
  /** Default model id like `openai/gpt-4o-mini` */
  defaultModel: string;
  providers: Partial<Record<ProviderId, ProviderCredential>>;
  chatgpt?: ChatGptAuth;
  updatedAt: string;
};

export type PublicSettings = {
  onboardingComplete: boolean;
  defaultModel: string;
  supercompress: {
    configured: boolean;
    apiUrl: string;
    forceLocal: boolean;
    source: "settings" | "env" | "none";
  };
  chatgpt: {
    connected: boolean;
    source?: ChatGptAuth["source"];
    accountId?: string;
  };
  providers: Array<{
    id: ProviderId;
    configured: boolean;
    hasKey: boolean;
    baseUrl?: string;
    enabled: boolean;
  }>;
  settingsPath: string;
};

export const DEFAULT_SETTINGS: OpenPagesSettings = {
  version: 1,
  onboardingComplete: false,
  supercompress: { apiKey: "", forceLocal: false },
  defaultModel: "chatgpt/gpt-5.4-mini",
  providers: {},
  updatedAt: new Date(0).toISOString(),
};

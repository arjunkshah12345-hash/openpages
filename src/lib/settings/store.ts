import fs from "fs";
import os from "os";
import path from "path";
import {
  DEFAULT_SETTINGS,
  type ChatGptAuth,
  type OpenPagesSettings,
  type ProviderCredential,
  type ProviderId,
  type PublicSettings,
  type SuperCompressSettings,
} from "./types";

function settingsPath(): string {
  if (process.env.OPENPAGES_SETTINGS_PATH) {
    return process.env.OPENPAGES_SETTINGS_PATH;
  }
  return path.join(os.homedir(), ".openpages", "settings.json");
}

function ensureDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function getSettingsPath(): string {
  return settingsPath();
}

export function loadSettings(): OpenPagesSettings {
  const file = settingsPath();
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ file)) {
      return { ...DEFAULT_SETTINGS, providers: {} };
    }
    const raw = JSON.parse(
      fs.readFileSync(/*turbopackIgnore: true*/ file, "utf8")
    ) as Partial<OpenPagesSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...raw,
      version: 1,
      supercompress: {
        ...DEFAULT_SETTINGS.supercompress,
        ...(raw.supercompress || {}),
      },
      providers: { ...(raw.providers || {}) },
      chatgpt: raw.chatgpt,
      onboardingComplete: Boolean(raw.onboardingComplete),
      defaultModel: raw.defaultModel || DEFAULT_SETTINGS.defaultModel,
      updatedAt: raw.updatedAt || DEFAULT_SETTINGS.updatedAt,
    };
  } catch {
    return { ...DEFAULT_SETTINGS, providers: {} };
  }
}

export function saveSettings(next: OpenPagesSettings): OpenPagesSettings {
  const file = settingsPath();
  ensureDir(file);
  const payload: OpenPagesSettings = {
    ...next,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    /*turbopackIgnore: true*/ file,
    JSON.stringify(payload, null, 2),
    { mode: 0o600 }
  );
  try {
    fs.chmodSync(/*turbopackIgnore: true*/ file, 0o600);
  } catch {
    // best-effort on platforms without chmod
  }
  return payload;
}

export function updateSettings(
  patch: Partial<Omit<OpenPagesSettings, "version" | "updatedAt">>
): OpenPagesSettings {
  const current = loadSettings();
  return saveSettings({
    ...current,
    ...patch,
    supercompress: {
      ...current.supercompress,
      ...(patch.supercompress || {}),
    },
    providers: {
      ...current.providers,
      ...(patch.providers || {}),
    },
    chatgpt: patch.chatgpt !== undefined ? patch.chatgpt : current.chatgpt,
  });
}

export function setProviderCredential(
  id: ProviderId,
  cred: ProviderCredential | null
): OpenPagesSettings {
  const current = loadSettings();
  const providers = { ...current.providers };
  if (!cred) {
    delete providers[id];
  } else {
    providers[id] = { ...providers[id], ...cred };
  }
  return updateSettings({ providers });
}

export function setSuperCompress(
  sc: Partial<SuperCompressSettings>
): OpenPagesSettings {
  return updateSettings({
    supercompress: { ...loadSettings().supercompress, ...sc },
  });
}

export function setChatGptAuth(auth: ChatGptAuth | null): OpenPagesSettings {
  const current = loadSettings();
  if (!auth) {
    return saveSettings({
      ...current,
      chatgpt: undefined,
    });
  }
  return updateSettings({
    chatgpt: auth,
    providers: {
      ...current.providers,
      openai: {
        ...current.providers.openai,
        enabled: true,
      },
      chatgpt: {
        ...current.providers.chatgpt,
        enabled: true,
      },
    },
  });
}

function maskKey(key?: string): boolean {
  return Boolean(key && key.trim().length > 0);
}

export function toPublicSettings(settings = loadSettings()): PublicSettings {
  const envSc = Boolean(process.env.SUPERCOMPRESS_API_KEY);
  const settingsSc = Boolean(settings.supercompress.apiKey);
  const scConfigured = settingsSc || envSc;

  const providerIds: ProviderId[] = [
    "openai",
    "chatgpt",
    "anthropic",
    "gemini",
    "openrouter",
    "ollama",
    "groq",
    "mistral",
    "deepseek",
    "together",
    "fireworks",
    "xai",
    "azure",
    "custom",
  ];

  return {
    onboardingComplete: settings.onboardingComplete,
    defaultModel: settings.defaultModel,
    supercompress: {
      configured: scConfigured,
      apiUrl:
        settings.supercompress.apiUrl ||
        process.env.SUPERCOMPRESS_API_URL ||
        "https://api.supercompress.dev/compress",
      forceLocal: Boolean(settings.supercompress.forceLocal),
      source: settingsSc ? "settings" : envSc ? "env" : "none",
    },
    chatgpt: {
      connected: Boolean(settings.chatgpt?.accessToken),
      source: settings.chatgpt?.source,
      accountId: settings.chatgpt?.accountId,
    },
    providers: providerIds.map((id) => {
      const cred = settings.providers[id];
      const envKey = envKeyForProvider(id);
      const hasKey =
        maskKey(cred?.apiKey) ||
        Boolean(envKey) ||
        (id === "openai" && Boolean(settings.chatgpt?.accessToken)) ||
        (id === "chatgpt" && Boolean(settings.chatgpt?.accessToken)) ||
        (id === "ollama" && true);
      return {
        id,
        configured: hasKey,
        hasKey,
        baseUrl: cred?.baseUrl,
        enabled: cred?.enabled !== false && hasKey,
      };
    }),
    settingsPath: getSettingsPath(),
  };
}

function envKeyForProvider(id: ProviderId): string | undefined {
  switch (id) {
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "gemini":
      return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    case "openrouter":
      return process.env.OPENROUTER_API_KEY;
    case "groq":
      return process.env.GROQ_API_KEY;
    case "mistral":
      return process.env.MISTRAL_API_KEY;
    case "deepseek":
      return process.env.DEEPSEEK_API_KEY;
    case "together":
      return process.env.TOGETHER_API_KEY;
    case "fireworks":
      return process.env.FIREWORKS_API_KEY;
    case "xai":
      return process.env.XAI_API_KEY;
    case "azure":
      return process.env.AZURE_OPENAI_API_KEY;
    case "ollama":
      return process.env.OLLAMA_BASE_URL || "local";
    default:
      return undefined;
  }
}

/** Resolve SuperCompress API key: settings file wins, then env. */
export function resolveSuperCompressKey(): string {
  const s = loadSettings();
  return s.supercompress.apiKey || process.env.SUPERCOMPRESS_API_KEY || "";
}

export function resolveSuperCompressUrl(): string {
  const s = loadSettings();
  return (
    s.supercompress.apiUrl ||
    process.env.SUPERCOMPRESS_API_URL ||
    "https://api.supercompress.dev/compress"
  );
}

export function resolveForceLocalCompress(): boolean {
  return Boolean(loadSettings().supercompress.forceLocal);
}

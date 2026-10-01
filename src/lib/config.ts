/**
 * OpenPages runtime config.
 *
 * SuperCompress sits in front of every model call:
 *   Workspace → Retrieval → SuperCompress → Model
 *
 * @see https://www.supercompress.dev
 * @see https://docs.supercompress.dev
 */

export const SUPERCOMPRESS = {
  /** Primary hosted compress endpoint */
  apiUrl:
    process.env.SUPERCOMPRESS_API_URL ||
    "https://api.supercompress.dev/compress",
  /** Legacy / docs alternate */
  fallbackApiUrl: "https://supercompress.dev/api/v1/compress",
  apiKey: process.env.SUPERCOMPRESS_API_KEY || "",
  dashboardUrl: "https://www.supercompress.dev/dashboard",
  docsUrl: "https://docs.supercompress.dev",
  siteUrl: "https://www.supercompress.dev",
  /** Default compiler mode — maximize tokens removed while keeping evidence */
  defaultMode: "compiler" as const,
} as const;

export const APP = {
  name: "OpenPages",
  tagline: "Your workspace, built for humans and agents.",
  positioning:
    "Persistent context without persistent token costs — SuperCompress keeps Spaces economically viable as they grow.",
  dataDir: process.env.OPENPAGES_DATA_DIR || "",
  defaultModel: "openai/gpt-4o-mini",
} as const;

/** Env-only check. Prefer resolveSuperCompressKey() from settings/store on the server. */
export function hasSuperCompressKey(): boolean {
  return Boolean(SUPERCOMPRESS.apiKey);
}

export function pipelineLabel(): string {
  return "Workspace → Retrieval → SuperCompress → Model";
}

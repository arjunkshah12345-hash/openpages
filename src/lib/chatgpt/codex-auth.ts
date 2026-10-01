/**
 * ChatGPT account auth via the public Codex OAuth client.
 *
 * Same flow as Codex CLI / VS Code Codex:
 *   1. Import ~/.codex/auth.json, or
 *   2. Device-code sign-in at auth.openai.com
 *
 * This is NOT cookie scraping. Tokens are the official ChatGPT session
 * credentials Codex already uses for Plus/Pro subscribers.
 */

import fs from "fs";
import os from "os";
import path from "path";
import type { ChatGptAuth } from "@/lib/settings/types";

export const CODEX_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
export const CODEX_ISSUER = "https://auth.openai.com";
export const CODEX_VERIFICATION_URL = `${CODEX_ISSUER}/codex/device`;
export const CODEX_REDIRECT_URI = `${CODEX_ISSUER}/deviceauth/callback`;

export type DeviceStartResult = {
  userCode: string;
  deviceAuthId: string;
  verificationUrl: string;
  intervalSeconds: number;
};

export type DevicePollPending = { status: "pending" };
export type DevicePollDone = {
  status: "authorized";
  auth: ChatGptAuth;
};
export type DevicePollResult = DevicePollPending | DevicePollDone;

type CodexAuthFile = {
  OPENAI_API_KEY?: string;
  tokens?: {
    access_token?: string;
    refresh_token?: string;
    account_id?: string;
    id_token?: string;
  };
  last_refresh?: string;
};

export function defaultCodexAuthPath(): string {
  return (
    process.env.CODEX_AUTH_PATH ||
    path.join(os.homedir(), ".codex", "auth.json")
  );
}

/** Decode JWT payload (no verify) for account id hints. */
function peekJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
      "utf8"
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function accountIdFromTokens(tokens: CodexAuthFile["tokens"]): string | undefined {
  if (tokens?.account_id) return tokens.account_id;
  const access = tokens?.access_token;
  if (!access) return undefined;
  const payload = peekJwtPayload(access);
  const auth = payload?.["https://api.openai.com/auth"] as
    | { chatgpt_account_id?: string }
    | undefined;
  return auth?.chatgpt_account_id;
}

/**
 * Import ChatGPT / Codex credentials from this machine.
 * Prefers ChatGPT access_token; falls back to OPENAI_API_KEY in the same file.
 */
export function importCodexAuth(authPath = defaultCodexAuthPath()): {
  auth: ChatGptAuth;
  apiKeyFallback?: string;
  path: string;
} {
  if (!fs.existsSync(authPath)) {
    throw new Error(
      `No Codex auth at ${authPath}. Run \`codex login\` first, or use Sign in with ChatGPT.`
    );
  }
  const raw = JSON.parse(fs.readFileSync(authPath, "utf8")) as CodexAuthFile;
  const access = raw.tokens?.access_token;
  if (access) {
    return {
      path: authPath,
      auth: {
        accessToken: access,
        refreshToken: raw.tokens?.refresh_token,
        accountId: accountIdFromTokens(raw.tokens),
        source: "import",
        lastRefresh: raw.last_refresh || new Date().toISOString(),
      },
      apiKeyFallback: raw.OPENAI_API_KEY,
    };
  }
  if (raw.OPENAI_API_KEY) {
    // API-key-only Codex install — treat as openai key, not ChatGPT session
    return {
      path: authPath,
      auth: {
        accessToken: raw.OPENAI_API_KEY,
        source: "import",
        lastRefresh: raw.last_refresh || new Date().toISOString(),
      },
      apiKeyFallback: raw.OPENAI_API_KEY,
    };
  }
  throw new Error(`Codex auth at ${authPath} has no tokens or OPENAI_API_KEY.`);
}

export async function startDeviceAuth(): Promise<DeviceStartResult> {
  const res = await fetch(`${CODEX_ISSUER}/api/accounts/deviceauth/usercode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CODEX_CLIENT_ID }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Device code request failed (${res.status}): ${body || res.statusText}`);
  }
  const data = (await res.json()) as {
    user_code: string;
    device_auth_id: string;
    interval?: number | string;
  };
  const intervalSeconds = Math.max(
    3,
    typeof data.interval === "string"
      ? parseInt(data.interval, 10) || 5
      : data.interval || 5
  );
  return {
    userCode: data.user_code,
    deviceAuthId: data.device_auth_id,
    verificationUrl: CODEX_VERIFICATION_URL,
    intervalSeconds,
  };
}

export async function pollDeviceAuth(
  deviceAuthId: string,
  userCode: string
): Promise<DevicePollResult> {
  const res = await fetch(`${CODEX_ISSUER}/api/accounts/deviceauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device_auth_id: deviceAuthId,
      user_code: userCode,
    }),
  });

  if (res.status === 403 || res.status === 404) {
    return { status: "pending" };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Device poll failed (${res.status}): ${body || res.statusText}`);
  }

  const codeBody = (await res.json()) as {
    authorization_code: string;
    code_verifier: string;
  };

  const tokenRes = await fetch(`${CODEX_ISSUER}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: codeBody.authorization_code,
      redirect_uri: CODEX_REDIRECT_URI,
      client_id: CODEX_CLIENT_ID,
      code_verifier: codeBody.code_verifier,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text().catch(() => "");
    throw new Error(`Token exchange failed (${tokenRes.status}): ${body || tokenRes.statusText}`);
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
  };

  const accountId =
    accountIdFromTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      id_token: tokens.id_token,
    }) || undefined;

  return {
    status: "authorized",
    auth: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accountId,
      source: "device",
      lastRefresh: new Date().toISOString(),
    },
  };
}

/** Refresh ChatGPT access token using Codex client id. */
export async function refreshChatGptToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken?: string }> {
  const res = await fetch(`${CODEX_ISSUER}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CODEX_CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Refresh failed (${res.status}): ${body || res.statusText}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

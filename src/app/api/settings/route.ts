import { NextResponse } from "next/server";
import {
  loadSettings,
  toPublicSettings,
  updateSettings,
} from "@/lib/settings/store";
import type { ProviderId, ProviderCredential } from "@/lib/settings/types";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(toPublicSettings());
}

export async function PUT(req: Request) {
  const body = (await req.json()) as {
    onboardingComplete?: boolean;
    defaultModel?: string;
    supercompress?: {
      apiKey?: string;
      apiUrl?: string;
      forceLocal?: boolean;
      /** Clear key when true */
      clearKey?: boolean;
    };
    providers?: Partial<Record<ProviderId, ProviderCredential | null>>;
  };

  const current = loadSettings();
  const providers = { ...current.providers };

  if (body.providers) {
    for (const [id, cred] of Object.entries(body.providers)) {
      if (cred === null) {
        delete providers[id as ProviderId];
      } else if (cred) {
        providers[id as ProviderId] = {
          ...providers[id as ProviderId],
          ...cred,
        };
      }
    }
  }

  const sc = { ...current.supercompress };
  if (body.supercompress) {
    if (body.supercompress.clearKey) sc.apiKey = "";
    if (typeof body.supercompress.apiKey === "string") {
      // Allow blank to mean "unchanged" when masked; only update when non-empty or explicit clear
      if (body.supercompress.apiKey.length > 0) {
        sc.apiKey = body.supercompress.apiKey.trim().replace(/^Bearer\s+/i, "");
        sc.forceLocal = false;
      }
    }
    if (typeof body.supercompress.apiUrl === "string") {
      sc.apiUrl = body.supercompress.apiUrl || undefined;
    }
    if (typeof body.supercompress.forceLocal === "boolean") {
      sc.forceLocal = body.supercompress.forceLocal;
      if (body.supercompress.forceLocal) {
        // Explicit offline mode — keep any saved key but prefer local until they reconnect
      }
    }
  }

  updateSettings({
    onboardingComplete:
      typeof body.onboardingComplete === "boolean"
        ? body.onboardingComplete
        : current.onboardingComplete,
    defaultModel: body.defaultModel || current.defaultModel,
    supercompress: sc,
    providers,
  });

  return NextResponse.json(toPublicSettings());
}

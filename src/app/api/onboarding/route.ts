import { NextResponse } from "next/server";
import {
  toPublicSettings,
  loadSettings,
  resolveSuperCompressKey,
} from "@/lib/settings/store";
import { hasAnyModelKey } from "@/lib/models/providers";

export const runtime = "nodejs";

function isEphemeralHost(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

export async function GET() {
  const settings = loadSettings();
  const pub = toPublicSettings(settings);
  // Local OSS installs: force the wizard once. Hosted demos use env vars — no gate.
  const needsOnboarding =
    !isEphemeralHost() && !settings.onboardingComplete;

  return NextResponse.json({
    needsOnboarding,
    hasSuperCompress: Boolean(resolveSuperCompressKey()),
    hasModel: hasAnyModelKey(),
    ephemeral: isEphemeralHost(),
    settings: pub,
  });
}

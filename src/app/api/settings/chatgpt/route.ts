import { NextResponse } from "next/server";
import {
  importCodexAuth,
  startDeviceAuth,
  pollDeviceAuth,
} from "@/lib/chatgpt/codex-auth";
import {
  setChatGptAuth,
  setProviderCredential,
  toPublicSettings,
  updateSettings,
} from "@/lib/settings/store";

export const runtime = "nodejs";

/** Import ~/.codex/auth.json (or CODEX_AUTH_PATH). */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    action?: "import" | "device-start" | "device-poll" | "disconnect";
    path?: string;
    deviceAuthId?: string;
    userCode?: string;
  };

  const action = body.action || "import";

  try {
    if (action === "disconnect") {
      setChatGptAuth(null);
      return NextResponse.json({ ok: true, settings: toPublicSettings() });
    }

    if (action === "import") {
      const result = importCodexAuth(body.path);
      setChatGptAuth(result.auth);
      // If the file only had an API key, also stash it under openai
      if (result.apiKeyFallback?.startsWith("sk-")) {
        setProviderCredential("openai", {
          apiKey: result.apiKeyFallback,
          enabled: true,
        });
      }
      updateSettings({
        defaultModel: "chatgpt/gpt-5.4-mini",
      });
      return NextResponse.json({
        ok: true,
        path: result.path,
        source: result.auth.source,
        accountId: result.auth.accountId,
        settings: toPublicSettings(),
      });
    }

    if (action === "device-start") {
      const device = await startDeviceAuth();
      return NextResponse.json({
        ok: true,
        userCode: device.userCode,
        deviceAuthId: device.deviceAuthId,
        verificationUrl: device.verificationUrl,
        intervalSeconds: device.intervalSeconds,
      });
    }

    if (action === "device-poll") {
      if (!body.deviceAuthId || !body.userCode) {
        return NextResponse.json(
          { ok: false, error: "deviceAuthId and userCode required" },
          { status: 400 }
        );
      }
      const poll = await pollDeviceAuth(body.deviceAuthId, body.userCode);
      if (poll.status === "pending") {
        return NextResponse.json({ ok: true, status: "pending" });
      }
      setChatGptAuth(poll.auth);
      updateSettings({ defaultModel: "chatgpt/gpt-5.4-mini" });
      return NextResponse.json({
        ok: true,
        status: "authorized",
        accountId: poll.auth.accountId,
        settings: toPublicSettings(),
      });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "ChatGPT auth failed",
        settings: toPublicSettings(),
      },
      { status: 400 }
    );
  }
}

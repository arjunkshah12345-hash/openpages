import { NextResponse } from "next/server";
import { resolveSuperCompressKey } from "@/lib/settings/store";
import { hasAnyModelKey } from "@/lib/models/providers";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "openpages",
    version: "1.0.0",
    time: new Date().toISOString(),
    supercompress: Boolean(resolveSuperCompressKey()),
    model: hasAnyModelKey(),
  });
}

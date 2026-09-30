import { NextResponse } from "next/server";
import { searchSpace } from "@/lib/retrieval/search";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get("spaceId");
  const q = searchParams.get("q") || "";

  if (!spaceId) {
    return NextResponse.json({ error: "spaceId required" }, { status: 400 });
  }

  const results = await searchSpace(spaceId, q);
  return NextResponse.json(results);
}

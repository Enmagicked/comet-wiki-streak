import { NextResponse } from "next/server";
import { search } from "@/lib/wiki";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (!q) return NextResponse.json({ results: [] });
  const results = await search(q);
  return NextResponse.json({ results });
}

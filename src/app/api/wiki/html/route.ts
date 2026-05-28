import { NextResponse } from "next/server";
import { getHtml } from "@/lib/wiki";

export async function GET(req: Request) {
  const title = new URL(req.url).searchParams.get("title");
  if (!title) return NextResponse.json({ error: "missing title" }, { status: 400 });
  const html = await getHtml(title);
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

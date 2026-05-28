import { NextResponse } from "next/server";
import { categoryMembers } from "@/lib/wiki";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const cat = sp.get("c") ?? "";
  const type = (sp.get("type") === "subcat" ? "subcat" : "page") as "page" | "subcat";
  if (!cat) return NextResponse.json({ items: [] });
  const items = await categoryMembers(cat, 30, type);
  return NextResponse.json({ items });
}

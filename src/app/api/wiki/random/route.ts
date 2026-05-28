import { NextResponse } from "next/server";
import { random } from "@/lib/wiki";

export async function GET() {
  const pages = await random(5);
  return NextResponse.json({ pages });
}

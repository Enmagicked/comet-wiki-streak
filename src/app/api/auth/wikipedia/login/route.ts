import { NextResponse } from "next/server";
import crypto from "crypto";
import { WM, redirectUri } from "@/lib/wikimedia";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const clientId = process.env.WIKIMEDIA_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/sign-in?error=wiki_not_configured", req.url));
  }
  const origin = new URL(req.url).origin;
  const state = crypto.randomBytes(16).toString("hex");

  const authUrl = new URL(WM.authorize);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri(origin));
  authUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set("wm_oauth_state", state, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600,
  });
  return res;
}

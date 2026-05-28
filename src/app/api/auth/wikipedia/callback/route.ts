import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { WM, redirectUri, parseWikiDate, type WikiProfile } from "@/lib/wikimedia";

export const dynamic = "force-dynamic";

function fail(req: Request, reason: string) {
  return NextResponse.redirect(new URL(`/sign-in?error=${reason}`, req.url));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const origin = url.origin;

  const cookieStore = await cookies();
  const savedState = cookieStore.get("wm_oauth_state")?.value;
  if (!code || !state || !savedState || state !== savedState) {
    return fail(req, "wiki_state");
  }

  const clientId = process.env.WIKIMEDIA_CLIENT_ID;
  const clientSecret = process.env.WIKIMEDIA_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail(req, "wiki_not_configured");

  // 1. Exchange code for an access token.
  let accessToken: string;
  try {
    const tokenRes = await fetch(WM.token, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri(origin),
      }),
    });
    if (!tokenRes.ok) return fail(req, "wiki_token");
    const tok = await tokenRes.json();
    accessToken = tok.access_token;
    if (!accessToken) return fail(req, "wiki_token");
  } catch {
    return fail(req, "wiki_token");
  }

  // 2. Fetch the Wikipedia profile.
  let profile: WikiProfile;
  try {
    const profRes = await fetch(WM.profile, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profRes.ok) return fail(req, "wiki_profile");
    profile = await profRes.json();
  } catch {
    return fail(req, "wiki_profile");
  }
  if (!profile?.sub || !profile?.username) return fail(req, "wiki_profile");

  // 3. Find-or-create the Supabase user keyed by Wikipedia user id.
  const admin = createAdminClient();
  const syntheticEmail = `wiki-${profile.sub}@users.cometwiki.app`;
  const meta = {
    display_name: profile.username,
    provider: "wikipedia",
    wiki_userid: String(profile.sub),
  };

  let userId: string | null = null;
  const created = await admin.auth.admin.createUser({
    email: syntheticEmail,
    email_confirm: true,
    user_metadata: meta,
  });
  if (created.data?.user) {
    userId = created.data.user.id;
  } else {
    // Already exists — look it up by the synthetic email.
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    userId = list?.users.find((u) => u.email === syntheticEmail)?.id ?? null;
  }
  if (!userId) return fail(req, "wiki_user");

  // 4. Mint a session via magic-link token, then verify it on a cookie-bound client.
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: syntheticEmail,
  });
  if (linkErr || !link?.properties?.hashed_token) return fail(req, "wiki_session");

  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  const supabase = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "").replace(/(\.supabase\.co).*$/i, "$1"),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(toSet) { toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); },
      },
    },
  );
  const { error: otpErr } = await supabase.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "magiclink",
  });
  if (otpErr) return fail(req, "wiki_session");

  // 5. Persist Wikipedia identity on the profile (service role, keyed by our user id).
  await admin.from("profiles").upsert({
    id: userId,
    display_name: profile.username,
    wiki_username: profile.username,
    wiki_userid: String(profile.sub),
    wiki_editcount: typeof profile.editcount === "number" ? profile.editcount : null,
    wiki_registered: parseWikiDate(profile.registered),
  }, { onConflict: "id" });

  response.cookies.set("wm_oauth_state", "", { path: "/", maxAge: 0 });
  return response;
}

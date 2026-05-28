import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const url = raw.replace(/\/+$/, "").replace(/(\.supabase\.co).*$/i, "$1");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
  const cookieStore = await cookies();
  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component — proxy will refresh the session instead.
          }
        },
      },
    },
  );
}

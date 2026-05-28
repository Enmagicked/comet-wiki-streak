import { createClient } from "@supabase/supabase-js";

// Service-role client — SERVER ONLY. Never import this into a client component.
// Bypasses RLS, so guard every use.
export function createAdminClient() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const url = raw.replace(/\/+$/, "").replace(/(\.supabase\.co).*$/i, "$1");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Admin client needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

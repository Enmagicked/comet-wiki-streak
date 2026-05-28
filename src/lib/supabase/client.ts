"use client";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Fall back to a syntactically valid URL during build/prerender — runtime requests
  // will fail loudly if env vars are missing in production.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
  return createBrowserClient(url, key);
}

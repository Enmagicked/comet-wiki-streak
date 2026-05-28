"use client";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Strip trailing slashes / accidental paths — common cause of "Invalid path" errors.
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const url = raw.replace(/\/+$/, "").replace(/(\.supabase\.co).*$/i, "$1");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
  return createBrowserClient(url, key);
}

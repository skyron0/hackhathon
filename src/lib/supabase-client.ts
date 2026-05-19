"use client";

import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Singleton Supabase client for browser/React-context usage.
 * Falls back to a local-only stub if env vars are missing — so the app
 * is still demoable on a laptop without a Supabase project.
 */
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (_client) return _client;
  _client = createBrowserClient(url, key);
  return _client;
}

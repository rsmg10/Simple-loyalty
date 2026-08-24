import { createClient } from "@supabase/supabase-js";

// Service-role client — only ever imported from API route handlers. The
// service role key must never reach the browser.
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
    // Next.js patches the global fetch to cache GET requests, including
    // ones made internally by supabase-js — route-level `dynamic =
    // "force-dynamic"` doesn't reliably reach into that. Every card/shop
    // read must be live, so force no-store here directly.
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

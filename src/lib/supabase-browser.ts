"use client";

import { createBrowserClient } from "@supabase/ssr";

// Anon-key client for the owner login/signup pages — distinct from
// src/lib/supabase.ts's service-role client, which stays server-only and
// privileged. This one is safe to ship to the browser; it can only do what
// a signed-in end user is allowed to do via Supabase Auth.
export function getSupabaseBrowserClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

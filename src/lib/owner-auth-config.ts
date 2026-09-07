// Deliberately dependency-free (no next/headers, no Supabase client) so
// middleware.ts — which cannot use next/headers's cookies() — can check
// this without pulling in anything cookie-related.
export function isOwnerAuthConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

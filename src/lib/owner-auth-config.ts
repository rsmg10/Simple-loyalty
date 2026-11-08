// Deliberately dependency-free (no next/headers, no Supabase client) so
// middleware.ts — which cannot use next/headers's cookies() — can check
// this without pulling in anything cookie-related.
export function isOwnerAuthConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Where /owner/login and /owner/signup send a freshly-authenticated owner.
// Multi-tenant deployments (NEXT_PUBLIC_APP_ROOT_DOMAIN set) route through
// onboarding, which decides between "create your first shop" and "go to
// your existing shop" — a single-tenant deployment using owner auth without
// multi-tenancy has no onboarding flow at all, so it goes straight to the
// one shop's /setup, exactly as slice 2 shipped.
export function postAuthRedirectPath(): string {
  return process.env.NEXT_PUBLIC_APP_ROOT_DOMAIN ? "/owner/onboarding" : "/setup";
}

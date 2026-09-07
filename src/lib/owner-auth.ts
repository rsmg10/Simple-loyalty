import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isOwnerAuthConfigured } from "./owner-auth-config";

export { isOwnerAuthConfigured };

function getServerClient() {
  const cookieStore = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // cookies() is read-only when called from a Server Component render
          // (as opposed to a Route Handler or Server Action) — safe to ignore,
          // middleware's session refresh (src/middleware.ts) covers that case.
        }
      },
    },
  });
}

// Returns the signed-in owner's user id, or null if there is no valid
// session — or if owner auth isn't configured at all, in which case this
// never makes a network call.
export async function getOwnerUserId(): Promise<string | null> {
  if (!isOwnerAuthConfigured()) return null;

  const supabase = getServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

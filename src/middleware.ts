import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isOwnerAuthConfigured } from "@/lib/owner-auth-config";
import { resolveShopSlug } from "@/lib/tenant";

const SHOP_SLUG_HEADER = "x-shop-slug";

// Pure hostname parsing, no I/O — this needs to run on every request, so it
// stays on the default Edge runtime rather than doing a DB lookup here. The
// actual shop lookup happens once, in getShop() (src/lib/shop-repo.ts),
// which reads the header this sets.
export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  // Never trust a client-supplied value for this — always overwrite below.
  requestHeaders.delete(SHOP_SLUG_HEADER);

  const slug = resolveShopSlug(request.headers.get("host") ?? "", process.env.APP_ROOT_DOMAIN);
  if (slug) requestHeaders.set(SHOP_SLUG_HEADER, slug);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // Silently refreshes an about-to-expire owner session (Supabase Auth)
  // before it reaches a Route Handler's getOwnerUserId() check — the
  // standard @supabase/ssr middleware pattern. A complete no-op unless
  // owner auth is configured, so every deployment that hasn't opted into
  // it (every existing single-café deployment) sees zero change here.
  if (isOwnerAuthConfigured()) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request: { headers: requestHeaders } });
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      },
    );
    await supabase.auth.getUser();
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

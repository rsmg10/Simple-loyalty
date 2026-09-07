import { NextResponse, type NextRequest } from "next/server";
import { resolveShopSlug } from "@/lib/tenant";

const SHOP_SLUG_HEADER = "x-shop-slug";

// Pure hostname parsing, no I/O — this needs to run on every request, so it
// stays on the default Edge runtime rather than doing a DB lookup here. The
// actual shop lookup happens once, in getShop() (src/lib/shop-repo.ts),
// which reads the header this sets.
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  // Never trust a client-supplied value for this — always overwrite below.
  requestHeaders.delete(SHOP_SLUG_HEADER);

  const slug = resolveShopSlug(request.headers.get("host") ?? "", process.env.APP_ROOT_DOMAIN);
  if (slug) requestHeaders.set(SHOP_SLUG_HEADER, slug);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

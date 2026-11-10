import { NextResponse } from "next/server";
import { resolveLocale } from "@/lib/i18n/locale";
import { getShop } from "@/lib/shop-repo";
import { buildWebManifest } from "@/lib/web-manifest";

// A route handler rather than app/manifest.ts: the start URL depends on the
// `?card=` query, which the metadata-file convention can't read. Live
// shop name, so never cached at build time.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const shop = await getShop();
  const cardId = new URL(request.url).searchParams.get("card");
  // Browsers fetch manifests without cookies, so the viewer's language
  // choice isn't visible here — the deployment default is.
  const locale = resolveLocale(undefined, process.env.DEFAULT_LOCALE);

  return NextResponse.json(buildWebManifest({ shopName: shop.name, locale, cardId }), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}

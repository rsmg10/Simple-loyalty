import { NextResponse } from "next/server";
import { parseLogoDataUrl } from "@/lib/logo";
import { parseJsonBody } from "@/lib/parse-json-body";
import { getManagedShop } from "@/lib/route-auth";
import { getShop } from "@/lib/shop-repo";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Public: the café's logo on the card and the counter sign. The URL carries
// a version (see GET /api/shop), so it can be cached for a long time.
export async function GET() {
  const shop = await getShop();
  const { data } = await getSupabaseAdmin().from("shops").select("logo_data_url").eq("id", shop.id).single();
  const logo = parseLogoDataUrl(data?.logo_data_url);
  if (!logo) {
    return NextResponse.json({ error: "No logo" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(logo.bytes), {
    headers: { "Content-Type": logo.contentType, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}

// Manager: { dataUrl } sets the logo (already shrunk by the browser),
// { dataUrl: null } removes it.
export async function PUT(request: Request) {
  const shop = await getManagedShop();
  if (!shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseJsonBody<{ dataUrl?: unknown }>(request);
  if (!body || (body.dataUrl !== null && !parseLogoDataUrl(body.dataUrl))) {
    return NextResponse.json({ error: "Logo must be a PNG, JPEG or WebP under 150 KB" }, { status: 400 });
  }

  const removing = body.dataUrl === null;
  const { error } = await getSupabaseAdmin()
    .from("shops")
    .update({ logo_data_url: removing ? null : body.dataUrl, logo_updated_at: removing ? null : new Date().toISOString() })
    .eq("id", shop.id);
  if (error) {
    return NextResponse.json({ error: "Failed to save logo" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

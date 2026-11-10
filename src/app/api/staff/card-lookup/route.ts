import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { toCardJson } from "@/lib/card-json";
import { parseJsonBody } from "@/lib/parse-json-body";
import { defaultPhoneCountryCode, normalizePhone } from "@/lib/phone";
import { getShop } from "@/lib/shop-repo";
import { STAFF_SESSION_COOKIE, verifyStaffSessionCookie } from "@/lib/staff-session";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Staff-only: finding a card by phone number returns its id, and the id is
// the card's only credential — so this must never be reachable without a
// staff session. POST rather than GET keeps the number out of URLs and
// access logs.
export async function POST(request: Request) {
  const shop = await getShop();
  const sessionCookie = cookies().get(STAFF_SESSION_COOKIE)?.value;
  if (!verifyStaffSessionCookie(sessionCookie, shop.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseJsonBody<{ phone?: string }>(request);
  const phone = typeof body?.phone === "string" ? normalizePhone(body.phone, defaultPhoneCountryCode()) : null;
  if (!phone) {
    return NextResponse.json({ error: "Enter a valid mobile number" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("cards")
    .select()
    .eq("shop_id", shop.id)
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json(toCardJson(data));
}

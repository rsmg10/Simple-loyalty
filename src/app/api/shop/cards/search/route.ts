import { NextResponse } from "next/server";
import { isCardId } from "@/lib/card-id";
import { parseJsonBody } from "@/lib/parse-json-body";
import { defaultPhoneCountryCode, normalizePhone } from "@/lib/phone";
import { getManagedShop } from "@/lib/route-auth";
import { getGroupShopIds } from "@/lib/shop-repo";
import { getSupabaseAdmin } from "@/lib/supabase";

// Finds a customer's card by phone number or full card code. POST keeps the
// number out of URLs and logs.
export async function POST(request: Request) {
  const shop = await getManagedShop();
  if (!shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseJsonBody<{ query?: unknown }>(request);
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  let filter: { column: "id" | "phone"; value: string } | null = null;
  if (isCardId(query)) {
    filter = { column: "id", value: query.toLowerCase() };
  } else {
    const phone = normalizePhone(query, defaultPhoneCountryCode());
    if (phone) filter = { column: "phone", value: phone };
  }
  if (!filter) {
    return NextResponse.json({ error: "Enter a phone number or card code", code: "invalid_query" }, { status: 400 });
  }

  const { data } = await getSupabaseAdmin()
    .from("cards")
    .select("id")
    .eq(filter.column, filter.value)
    .in("shop_id", await getGroupShopIds(shop))
    .limit(1)
    .maybeSingle();
  if (!data) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }
  return NextResponse.json({ cardId: data.id });
}

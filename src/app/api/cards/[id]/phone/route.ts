import { NextResponse } from "next/server";
import { toCardJson } from "@/lib/card-json";
import { parseJsonBody } from "@/lib/parse-json-body";
import { defaultPhoneCountryCode, normalizePhone } from "@/lib/phone";
import { getShop } from "@/lib/shop-repo";
import { getSupabaseAdmin } from "@/lib/supabase";

const UNIQUE_VIOLATION = "23505";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<{ phone?: string }>(request);
  const phone = typeof body?.phone === "string" ? normalizePhone(body.phone, defaultPhoneCountryCode()) : null;
  if (!phone) {
    return NextResponse.json({ error: "Enter a valid mobile number", code: "invalid_phone" }, { status: 400 });
  }

  const shop = await getShop();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("cards")
    .update({ phone })
    .eq("id", params.id)
    .eq("shop_id", shop.id)
    .select()
    .single();

  // Another card at this shop already has the number. Not merged or moved
  // automatically: anyone can type any number here, so handing over that
  // card's stamps is left to staff, who can see the customer (the
  // "Move card to customer's phone" QR on the staff screen).
  if (error?.code === UNIQUE_VIOLATION) {
    return NextResponse.json(
      { error: "That number is already on another card", code: "phone_taken" },
      { status: 409 },
    );
  }
  if (error || !data) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json(toCardJson(data));
}

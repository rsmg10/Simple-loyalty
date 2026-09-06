import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { applyStamp, toCardJson } from "@/lib/card-json";
import { sendStampReminderEmail } from "@/lib/email";
import { upsertGoogleWalletObject } from "@/lib/google-wallet";
import { getShop } from "@/lib/shop-repo";
import { STAFF_SESSION_COOKIE, verifyStaffSessionCookie } from "@/lib/staff-session";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const shop = await getShop();
  const sessionCookie = cookies().get(STAFF_SESSION_COOKIE)?.value;
  if (!verifyStaffSessionCookie(sessionCookie, shop.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await supabase
    .from("cards")
    .select()
    .eq("id", params.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const { stamps_earned, redemptions } = applyStamp(existing);

  const { data: updated, error: updateError } = await supabase
    .from("cards")
    .update({ stamps_earned, redemptions, lifetime_stamps: existing.lifetime_stamps + 1 })
    .eq("id", params.id)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Failed to add stamp" }, { status: 500 });
  }

  const stampsRemaining = updated.stamps_required - updated.stamps_earned;
  if (stampsRemaining === 1 && updated.email) {
    // Fire-and-forget so a slow/failed email send never delays the staff UI.
    sendStampReminderEmail(updated.email, shop.name, stampsRemaining, updated.id).catch(() => {});
  }

  // Fire-and-forget — keeps any Google Wallet pass the customer already
  // added in sync. A no-op if Google Wallet isn't configured.
  upsertGoogleWalletObject({
    cardId: updated.id,
    stampsEarned: updated.stamps_earned,
    stampsRequired: updated.stamps_required,
    shopName: shop.name,
  }).catch(() => {});

  return NextResponse.json(toCardJson(updated));
}

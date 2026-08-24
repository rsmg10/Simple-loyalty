import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { toCardJson } from "@/lib/card-json";
import { sendStampReminderEmail } from "@/lib/email";
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

  let stampsEarned = existing.stamps_earned + 1;
  let redemptions = existing.redemptions;
  if (stampsEarned >= existing.stamps_required) {
    stampsEarned = 0;
    redemptions += 1;
  }

  const { data: updated, error: updateError } = await supabase
    .from("cards")
    .update({ stamps_earned: stampsEarned, redemptions })
    .eq("id", params.id)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Failed to add stamp" }, { status: 500 });
  }

  const stampsRemaining = updated.stamps_required - updated.stamps_earned;
  if (stampsRemaining === 1 && updated.email) {
    // Fire-and-forget so a slow/failed email send never delays the staff UI.
    sendStampReminderEmail(updated.email, shop.name, stampsRemaining).catch(() => {});
  }

  return NextResponse.json(toCardJson(updated));
}

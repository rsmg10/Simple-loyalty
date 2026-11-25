import { NextResponse } from "next/server";
import { stampCard } from "@/lib/card-actions";
import { MAX_STAMPS_PER_PURCHASE } from "@/lib/card-json";
import { sendStampReminderEmail } from "@/lib/email";
import { updateGoogleWalletObject } from "@/lib/google-wallet";
import { parseJsonBody } from "@/lib/parse-json-body";
import { getStaffContext } from "@/lib/route-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const context = await getStaffContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { shop, staffMemberId } = context;

  // `count` is optional — no body means one stamp, as before.
  const body = await parseJsonBody<{ count?: unknown }>(request);
  const count = body?.count ?? 1;
  if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > MAX_STAMPS_PER_PURCHASE) {
    return NextResponse.json(
      { error: `count must be a whole number from 1 to ${MAX_STAMPS_PER_PURCHASE}` },
      { status: 400 },
    );
  }

  // Promotions, the reward rollover, the visit count and the log entry all
  // happen atomically in the database (stamp_card, migration 0005). Cards
  // from another shop come back "not found", same as a missing one.
  const result = await stampCard(params.id, shop.id, count, staffMemberId);
  if (!result.ok) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }
  const { card, eventId, bonus } = result;

  const stampsRemaining = card.stampsRequired - card.stampsEarned;
  if (stampsRemaining === 1) {
    // Fire-and-forget so a slow/failed email never delays the staff UI.
    getSupabaseAdmin()
      .from("cards")
      .select("email")
      .eq("id", card.id)
      .single()
      .then(({ data }) => {
        if (data?.email) sendStampReminderEmail(data.email, shop.name, stampsRemaining, card.id).catch(() => {});
      });
  }

  // Fire-and-forget — keeps any Google Wallet pass the customer already
  // added in sync. A no-op if Google Wallet isn't configured.
  updateGoogleWalletObject({
    cardId: card.id,
    shopId: shop.id,
    stampsEarned: card.stampsEarned,
    stampsRequired: card.stampsRequired,
    shopName: shop.name,
  }).catch(() => {});

  return NextResponse.json({ ...card, eventId, bonus });
}

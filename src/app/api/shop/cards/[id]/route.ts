import { NextResponse } from "next/server";
import { adjustCardStamps } from "@/lib/card-actions";
import type { ActivityRow } from "@/lib/activity";
import type { CardRow } from "@/lib/card-json";
import { HISTORY_COLUMNS, HISTORY_LIMIT, toCustomerDetail } from "@/lib/customer-detail";
import { parseJsonBody } from "@/lib/parse-json-body";
import { getManagedShop } from "@/lib/route-auth";
import { getGroupShopIds, type Shop } from "@/lib/shop-repo";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function loadCard(shop: Shop, cardId: string) {
  const { data } = await getSupabaseAdmin()
    .from("cards")
    .select()
    .eq("id", cardId)
    .in("shop_id", await getGroupShopIds(shop))
    .maybeSingle();
  return data as (CardRow & { created_at: string }) | null;
}

async function detail(shop: Shop, card: CardRow & { created_at: string }) {
  const { data } = await getSupabaseAdmin()
    .from("stamp_events")
    .select(HISTORY_COLUMNS)
    .eq("card_id", card.id)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  return toCustomerDetail(card, (data ?? []) as unknown as ActivityRow[]);
}

// A customer's card with its recent history, for the owner.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const shop = await getManagedShop();
  if (!shop) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const card = await loadCard(shop, params.id);
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
  return NextResponse.json(await detail(shop, card));
}

// Owner correction: set the current stamp count (logged as an adjustment).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const shop = await getManagedShop();
  if (!shop) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await parseJsonBody<{ stampsEarned?: unknown }>(request);
  if (typeof body?.stampsEarned !== "number" || !Number.isInteger(body.stampsEarned)) {
    return NextResponse.json({ error: "stampsEarned must be a whole number" }, { status: 400 });
  }
  const result = await adjustCardStamps(params.id, shop.id, body.stampsEarned);
  if (!result.ok) {
    return result.error === "out_of_range"
      ? NextResponse.json({ error: "Stamps must be from 0 to one less than the card size", code: "out_of_range" }, { status: 400 })
      : NextResponse.json({ error: "Card not found" }, { status: 404 });
  }
  const card = await loadCard(shop, params.id);
  return card ? NextResponse.json(await detail(shop, card)) : NextResponse.json({ error: "Card not found" }, { status: 404 });
}

// Deletes the card and its history for good — a customer's request to be
// forgotten. Their phone stops working on it immediately.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const shop = await getManagedShop();
  if (!shop) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await getSupabaseAdmin()
    .from("cards")
    .delete()
    .eq("id", params.id)
    .in("shop_id", await getGroupShopIds(shop))
    .select("id");
  if (!data?.length) return NextResponse.json({ error: "Card not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

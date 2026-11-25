import { NextResponse } from "next/server";
import { toCardJson } from "@/lib/card-json";
import { getShopCard } from "@/lib/shop-card";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { shop, card } = await getShopCard(params.id);
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("cards")
    .update({ last_seen_redemptions: card.redemptions })
    .eq("id", card.id)
    .eq("shop_id", shop.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }

  return NextResponse.json(toCardJson(data));
}

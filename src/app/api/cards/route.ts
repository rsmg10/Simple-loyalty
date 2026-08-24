import { NextResponse } from "next/server";
import { toCardJson } from "@/lib/card-json";
import { getShop } from "@/lib/shop-repo";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST() {
  const shop = await getShop();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("cards")
    .insert({ shop_id: shop.id, stamps_required: shop.stampsRequired })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }

  return NextResponse.json(toCardJson(data));
}

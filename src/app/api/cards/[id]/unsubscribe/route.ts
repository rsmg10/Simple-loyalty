import { NextResponse } from "next/server";
import { toCardJson } from "@/lib/card-json";
import { getShop } from "@/lib/shop-repo";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const shop = await getShop();
  const { data, error } = await getSupabaseAdmin()
    .from("cards")
    .update({ email: null })
    .eq("id", params.id)
    .eq("shop_id", shop.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json(toCardJson(data));
}

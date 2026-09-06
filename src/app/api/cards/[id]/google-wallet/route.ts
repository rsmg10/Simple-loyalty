import { NextResponse } from "next/server";
import { getGoogleWalletSaveUrl, isGoogleWalletConfigured } from "@/lib/google-wallet";
import { getShop } from "@/lib/shop-repo";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isGoogleWalletConfigured()) {
    return NextResponse.json({ error: "Google Wallet is not configured" }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data: card, error } = await supabase.from("cards").select().eq("id", params.id).single();
  if (error || !card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const shop = await getShop();
  const saveUrl = await getGoogleWalletSaveUrl({
    cardId: card.id,
    stampsEarned: card.stamps_earned,
    stampsRequired: card.stamps_required,
    shopName: shop.name,
  });

  return NextResponse.json({ saveUrl });
}

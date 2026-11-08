import { NextResponse } from "next/server";
import {
  ensureGoogleWalletClass,
  getGoogleWalletSaveUrl,
  isGoogleWalletConfigured,
} from "@/lib/google-wallet";
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
  // A card belongs to one shop; don't mint a pass for it under another's class.
  if (card.shop_id !== shop.id) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  await ensureGoogleWalletClass({ shopId: shop.id, shopName: shop.name });
  const saveUrl = await getGoogleWalletSaveUrl({
    cardId: card.id,
    shopId: shop.id,
    stampsEarned: card.stamps_earned,
    stampsRequired: card.stamps_required,
    shopName: shop.name,
  });

  return NextResponse.json({ saveUrl });
}

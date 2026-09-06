import { NextResponse } from "next/server";
import { generateApplePass, isAppleWalletConfigured } from "@/lib/apple-wallet";
import { getShop } from "@/lib/shop-repo";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isAppleWalletConfigured()) {
    return NextResponse.json({ error: "Apple Wallet is not configured" }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data: card, error } = await supabase.from("cards").select().eq("id", params.id).single();
  if (error || !card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const shop = await getShop();
  const buffer = await generateApplePass({
    cardId: card.id,
    stampsEarned: card.stamps_earned,
    stampsRequired: card.stamps_required,
    shopName: shop.name,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="${shop.name.replace(/[^a-zA-Z0-9]/g, "")}-loyalty-card.pkpass"`,
    },
  });
}

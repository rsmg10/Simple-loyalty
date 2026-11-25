import type { CardRow } from "./card-json";
import { getGroupShopIds, getShop, type Shop } from "./shop-repo";
import { getSupabaseAdmin } from "./supabase";

// The card with this id *usable at the shop this request is for* (its own,
// or a branch in the same group) — or null. Every public card route goes
// through this, so a card id from one shop never reads or changes anything
// on an unrelated shop's subdomain. A malformed id (not a UUID) is just
// "not found".
export async function getShopCard(cardId: string): Promise<{ shop: Shop; card: CardRow | null }> {
  const shop = await getShop();
  const { data } = await getSupabaseAdmin()
    .from("cards")
    .select()
    .eq("id", cardId)
    .in("shop_id", await getGroupShopIds(shop))
    .maybeSingle();
  return { shop, card: (data as CardRow | null) ?? null };
}

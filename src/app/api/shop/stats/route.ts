import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAuthorizedForShopSettings } from "@/lib/shop-auth";
import { selectAllShopCards } from "@/lib/shop-cards";
import { getShop } from "@/lib/shop-repo";
import { computeShopStats, type StatsRow } from "@/lib/shop-stats";
import { STAFF_SESSION_COOKIE } from "@/lib/staff-session";

// Stats are read from the database on every request — never prerender or
// cache this route (see src/lib/supabase.ts's getSupabaseAdmin for the
// underlying no-store fetch that backs this).
export const dynamic = "force-dynamic";

export async function GET() {
  const shop = await getShop();
  const staffSessionCookie = cookies().get(STAFF_SESSION_COOKIE)?.value;
  if (!(await isAuthorizedForShopSettings(shop, staffSessionCookie))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // A café's cards are a few int columns each — summing them here is
  // simpler than a DB view or RPC, and plenty fast at café scale.
  const rows = await selectAllShopCards<StatsRow>(shop.id, "lifetime_stamps, redemptions, last_stamped_at");
  if (!rows) {
    return NextResponse.json({ error: "Failed to load shop stats" }, { status: 500 });
  }

  return NextResponse.json(computeShopStats(rows));
}

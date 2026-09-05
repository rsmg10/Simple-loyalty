import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getShop } from "@/lib/shop-repo";
import { STAFF_SESSION_COOKIE, verifyStaffSessionCookie } from "@/lib/staff-session";
import { getSupabaseAdmin } from "@/lib/supabase";

// Stats are read from the database on every request — never prerender or
// cache this route (see src/lib/supabase.ts's getSupabaseAdmin for the
// underlying no-store fetch that backs this).
export const dynamic = "force-dynamic";

export async function GET() {
  const shop = await getShop();
  const sessionCookie = cookies().get(STAFF_SESSION_COOKIE)?.value;
  if (!verifyStaffSessionCookie(sessionCookie, shop.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  // This is a single small café — fetching every card's two int columns and
  // summing them here is simpler and plenty fast, no need for a DB view or
  // RPC to get server-side SUM().
  const { data, error } = await supabase
    .from("cards")
    .select("lifetime_stamps, redemptions")
    .eq("shop_id", shop.id);

  if (error || !data) {
    return NextResponse.json({ error: "Failed to load shop stats" }, { status: 500 });
  }

  const totalCards = data.length;
  const totalStampsGiven = data.reduce((sum, row) => sum + row.lifetime_stamps, 0);
  const totalRedemptions = data.reduce((sum, row) => sum + row.redemptions, 0);

  return NextResponse.json({ totalCards, totalStampsGiven, totalRedemptions });
}

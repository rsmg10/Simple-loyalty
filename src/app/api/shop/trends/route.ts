import { NextResponse } from "next/server";
import { getManagedShop } from "@/lib/route-auth";
import { selectAllPages } from "@/lib/shop-cards";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TREND_WEEKS, weeklyTrends, type TrendEventRow } from "@/lib/trends";

export const dynamic = "force-dynamic";

export async function GET() {
  const shop = await getManagedShop();
  if (!shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const since = new Date(now.getTime() - TREND_WEEKS * 7 * 24 * 60 * 60 * 1000).toISOString();
  const supabase = getSupabaseAdmin();
  const [events, cards] = await Promise.all([
    selectAllPages<TrendEventRow>((from, to) =>
      supabase
        .from("stamp_events")
        .select("kind, created_at, undone_at, stamps_added")
        .eq("shop_id", shop.id)
        .gte("created_at", since)
        .order("id")
        .range(from, to),
    ),
    selectAllPages<{ created_at: string }>((from, to) =>
      supabase.from("cards").select("created_at").eq("shop_id", shop.id).gte("created_at", since).order("id").range(from, to),
    ),
  ]);
  if (!events || !cards) {
    return NextResponse.json({ error: "Failed to load trends" }, { status: 500 });
  }

  return NextResponse.json({
    weeks: weeklyTrends(
      events,
      cards.map((card) => card.created_at),
      now,
    ),
  });
}

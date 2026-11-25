import { NextResponse } from "next/server";
import { ACTIVITY_COLUMNS, toActivityJson, type ActivityRow } from "@/lib/activity";
import { getManagedShop } from "@/lib/route-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
const LIMIT = 100;

// The latest stamps, reward handovers and corrections at this shop, with
// who did them — how an owner spots stamps given out to friends.
export async function GET() {
  const shop = await getManagedShop();
  if (!shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("stamp_events")
    .select(ACTIVITY_COLUMNS)
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  if (error || !data) {
    return NextResponse.json({ error: "Failed to load activity" }, { status: 500 });
  }
  return NextResponse.json({ events: (data as unknown as ActivityRow[]).map(toActivityJson) });
}

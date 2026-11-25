import { NextResponse } from "next/server";
import { reminderLists, type ReminderRow } from "@/lib/reminders";
import { getManagedShop } from "@/lib/route-auth";
import { selectAllShopCards } from "@/lib/shop-cards";

export const dynamic = "force-dynamic";

// Customers worth a message today (one stamp away, a reward waiting, or a
// regular who's stopped coming), for the owner to WhatsApp in one tap.
export async function GET() {
  const shop = await getManagedShop();
  if (!shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await selectAllShopCards<ReminderRow>(
    shop.id,
    "phone, stamps_earned, stamps_required, redemptions, rewards_used, visits, last_stamped_at",
    { withPhoneOnly: true },
  );
  if (!rows) {
    return NextResponse.json({ error: "Failed to load reminders" }, { status: 500 });
  }
  return NextResponse.json(reminderLists(rows));
}

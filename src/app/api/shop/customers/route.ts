import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { toCustomerList, type CustomerRow } from "@/lib/customer-list";
import { isAuthorizedForShopSettings } from "@/lib/shop-auth";
import { selectAllShopCards } from "@/lib/shop-cards";
import { getShop } from "@/lib/shop-repo";
import { STAFF_SESSION_COOKIE } from "@/lib/staff-session";

export const dynamic = "force-dynamic";

// Customers who added a phone number, with full numbers so the owner can
// message them on WhatsApp. Same gate as the rest of /setup: the owner
// account if one is linked, otherwise the staff PIN.
export async function GET() {
  const shop = await getShop();
  const staffSessionCookie = cookies().get(STAFF_SESSION_COOKIE)?.value;
  if (!(await isAuthorizedForShopSettings(shop, staffSessionCookie))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await selectAllShopCards<CustomerRow>(
    shop.id,
    "phone, lifetime_stamps, stamps_earned, stamps_required, last_stamped_at",
    { withPhoneOnly: true },
  );
  if (!rows) {
    return NextResponse.json({ error: "Failed to load customers" }, { status: 500 });
  }

  return NextResponse.json({ customers: toCustomerList(rows) });
}

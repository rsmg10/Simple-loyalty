import { cookies } from "next/headers";
import { isAuthorizedForShopSettings } from "./shop-auth";
import { getShop, type Shop } from "./shop-repo";
import { STAFF_SESSION_COOKIE, readStaffSession } from "./staff-session";

// The shop, if this request may manage it (owner account, or the manager
// PIN for shops without one) — else null.
export async function getManagedShop(): Promise<Shop | null> {
  const shop = await getShop();
  return (await isAuthorizedForShopSettings(shop, cookies().get(STAFF_SESSION_COOKIE)?.value)) ? shop : null;
}

// The shop and who's at the counter, if this request has a staff session
// (manager PIN or a staff member's own) — else null.
export async function getStaffContext(): Promise<{ shop: Shop; staffMemberId: string | null } | null> {
  const shop = await getShop();
  const session = readStaffSession(cookies().get(STAFF_SESSION_COOKIE)?.value, shop.id);
  return session ? { shop, staffMemberId: session.staffMemberId } : null;
}

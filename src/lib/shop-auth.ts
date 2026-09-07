import { getOwnerUserId } from "./owner-auth";
import type { Shop } from "./shop-repo";
import { verifyStaffSessionCookie } from "./staff-session";

// Gates shop-settings actions (PUT /api/shop, GET /api/shop/stats). Once a
// shop has a real owner account linked (shop.ownerUserId set), that account
// is the only thing that can manage settings — the shared staff PIN no
// longer suffices, since staff and the owner become different trust levels
// once a real account exists. Until then (every shop that hasn't opted in,
// including every existing single-café deployment), nothing changes: the
// staff PIN remains the only gate, exactly as before this existed.
//
// Takes the staff-session cookie value as a parameter rather than reading
// cookies() itself, matching verifyStaffSessionCookie's own convention —
// keeps the staff-PIN branch pure and unit-testable without needing a real
// Next.js request context.
export async function isAuthorizedForShopSettings(
  shop: Shop,
  staffSessionCookie: string | undefined,
): Promise<boolean> {
  if (shop.ownerUserId) {
    const ownerUserId = await getOwnerUserId();
    return ownerUserId === shop.ownerUserId;
  }

  return verifyStaffSessionCookie(staffSessionCookie, shop.id);
}

import { createHmac, timingSafeEqual } from "crypto";

export const STAFF_SESSION_COOKIE = "staff_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function sign(payload: string): string {
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret) throw new Error("STAFF_SESSION_SECRET must be set");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

// Two kinds of session:
// - manager (signed in with the shop's own PIN): `shopId.expiresAt.sig` —
//   the original format, so sessions from before staff accounts stay valid.
// - staff member (signed in with their own PIN): `shopId.expiresAt.staffId.sig`.
//   Can stamp and hand out rewards, but not open /setup.
export function createStaffSessionCookie(
  shopId: string,
  staffMemberId: string | null = null,
): { value: string; maxAge: number } {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = staffMemberId ? `${shopId}.${expiresAt}.${staffMemberId}` : `${shopId}.${expiresAt}`;
  return { value: `${payload}.${sign(payload)}`, maxAge: SESSION_TTL_MS / 1000 };
}

export type StaffSession = { staffMemberId: string | null };

// The session if the cookie is valid for this shop, else null.
// `staffMemberId: null` means the manager PIN.
export function readStaffSession(cookieValue: string | undefined, shopId: string): StaffSession | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 3 && parts.length !== 4) return null;
  const signature = parts[parts.length - 1];
  const payloadParts = parts.slice(0, -1);
  const [cookieShopId, expiresAtRaw, staffMemberId] = payloadParts;

  if (cookieShopId !== shopId) return null;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  const a = Buffer.from(signature);
  const b = Buffer.from(sign(payloadParts.join(".")));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return { staffMemberId: staffMemberId ?? null };
}

export function verifyStaffSessionCookie(cookieValue: string | undefined, shopId: string): boolean {
  return readStaffSession(cookieValue, shopId) !== null;
}

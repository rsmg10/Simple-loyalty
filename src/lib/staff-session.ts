import { createHmac, timingSafeEqual } from "crypto";

export const STAFF_SESSION_COOKIE = "staff_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function sign(payload: string): string {
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret) throw new Error("STAFF_SESSION_SECRET must be set");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createStaffSessionCookie(shopId: string): { value: string; maxAge: number } {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${shopId}.${expiresAt}`;
  const signature = sign(payload);
  return { value: `${payload}.${signature}`, maxAge: SESSION_TTL_MS / 1000 };
}

export function verifyStaffSessionCookie(cookieValue: string | undefined, shopId: string): boolean {
  if (!cookieValue) return false;
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return false;
  const [cookieShopId, expiresAtRaw, signature] = parts;

  if (cookieShopId !== shopId) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expectedSignature = sign(`${cookieShopId}.${expiresAtRaw}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

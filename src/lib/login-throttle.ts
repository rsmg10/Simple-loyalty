import { createHmac } from "crypto";

// Staff PIN guessing is throttled at two levels:
// - per client (one device / IP): a few wrong tries lock out *that client*
//   for a while. Someone at a table can no longer lock the staff out just
//   by typing wrong PINs on their own phone.
// - per shop: a much higher bar across all clients, so guessing from many
//   devices at once is still slowed down.
// Staff who are already signed in (12-hour sessions) are never affected.
export const CLIENT_LIMITS = { maxFailures: 5, lockoutMs: 15 * 60 * 1000 };
export const SHOP_LIMITS = { maxFailures: 20, lockoutMs: 15 * 60 * 1000 };

export type AttemptState = { failedAttempts: number; lockedUntil: string | null };

export const NO_ATTEMPTS: AttemptState = { failedAttempts: 0, lockedUntil: null };

export function isLocked(state: AttemptState, now: Date = new Date()): boolean {
  return !!state.lockedUntil && new Date(state.lockedUntil).getTime() > now.getTime();
}

// The state after one more wrong PIN. Reaching the limit starts a lockout
// and resets the count, so the next streak after it expires starts fresh.
export function afterFailure(
  state: AttemptState,
  limits: { maxFailures: number; lockoutMs: number },
  now: Date = new Date(),
): AttemptState {
  const failedAttempts = state.failedAttempts + 1;
  if (failedAttempts >= limits.maxFailures) {
    return { failedAttempts: 0, lockedUntil: new Date(now.getTime() + limits.lockoutMs).toISOString() };
  }
  return { failedAttempts, lockedUntil: state.lockedUntil };
}

// Vercel sets x-forwarded-for itself (the first entry is the real client),
// so it can't be spoofed there. Behind a proxy that passes the header
// through untouched it could be — the shop-wide limit still applies then.
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

// Keyed hash, so the table never holds an IP address that could be read
// back.
export function clientKey(ip: string, secret: string): string {
  return createHmac("sha256", secret).update(`staff-login:${ip}`).digest("hex");
}

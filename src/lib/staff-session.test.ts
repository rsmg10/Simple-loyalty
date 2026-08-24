import { createHmac } from "crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { createStaffSessionCookie, verifyStaffSessionCookie } from "./staff-session";

beforeAll(() => {
  process.env.STAFF_SESSION_SECRET = "test-secret-not-for-real-use";
});

describe("staff session cookie", () => {
  it("verifies a cookie it just signed for the same shop", () => {
    const { value } = createStaffSessionCookie("shop-123");
    expect(verifyStaffSessionCookie(value, "shop-123")).toBe(true);
  });

  it("rejects a cookie signed for a different shop", () => {
    const { value } = createStaffSessionCookie("shop-123");
    expect(verifyStaffSessionCookie(value, "shop-456")).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const { value } = createStaffSessionCookie("shop-123");
    const tampered = value.slice(0, -1) + (value.endsWith("a") ? "b" : "a");
    expect(verifyStaffSessionCookie(tampered, "shop-123")).toBe(false);
  });

  it("rejects a missing cookie", () => {
    expect(verifyStaffSessionCookie(undefined, "shop-123")).toBe(false);
  });

  it("rejects an expired cookie", () => {
    const cookie = signExpired("shop-123", Date.now() - 1000);
    expect(verifyStaffSessionCookie(cookie, "shop-123")).toBe(false);
  });
});

// Mirrors the private `sign()` helper in staff-session.ts so this test can
// construct an already-expired-but-validly-signed cookie.
function signExpired(shopId: string, expiresAt: number): string {
  const payload = `${shopId}.${expiresAt}`;
  const signature = createHmac("sha256", process.env.STAFF_SESSION_SECRET!)
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

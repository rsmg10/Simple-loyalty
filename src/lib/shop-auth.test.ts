import { beforeAll, describe, expect, it, vi } from "vitest";
import { isAuthorizedForShopSettings } from "./shop-auth";
import { createStaffSessionCookie } from "./staff-session";
import type { Shop } from "./shop-repo";

const { getOwnerUserId } = vi.hoisted(() => ({ getOwnerUserId: vi.fn() }));
vi.mock("./owner-auth", () => ({ getOwnerUserId }));

beforeAll(() => {
  process.env.STAFF_SESSION_SECRET = "test-secret-not-for-real-use";
});

function makeShop(overrides: Partial<Shop> = {}): Shop {
  return {
    id: "shop-123",
    name: "Test Shop",
    stampsRequired: 9,
    staffPinHash: "irrelevant-for-this-test",
    failedPinAttempts: 0,
    pinLockedUntil: null,
    ownerUserId: null,
    ...overrides,
  };
}

describe("isAuthorizedForShopSettings", () => {
  it("falls back to the staff-session cookie when no owner is linked", async () => {
    const shop = makeShop({ ownerUserId: null });
    const { value } = createStaffSessionCookie(shop.id);

    expect(await isAuthorizedForShopSettings(shop, value)).toBe(true);
    expect(await isAuthorizedForShopSettings(shop, undefined)).toBe(false);
    expect(getOwnerUserId).not.toHaveBeenCalled();
  });

  it("authorizes only the linked owner once one is set, ignoring the staff cookie", async () => {
    const shop = makeShop({ ownerUserId: "user-abc" });
    const { value: staffCookie } = createStaffSessionCookie(shop.id);

    getOwnerUserId.mockResolvedValueOnce("user-abc");
    expect(await isAuthorizedForShopSettings(shop, staffCookie)).toBe(true);

    getOwnerUserId.mockResolvedValueOnce("user-xyz");
    expect(await isAuthorizedForShopSettings(shop, staffCookie)).toBe(false);

    getOwnerUserId.mockResolvedValueOnce(null);
    expect(await isAuthorizedForShopSettings(shop, staffCookie)).toBe(false);
  });
});

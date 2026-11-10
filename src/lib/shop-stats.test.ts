import { describe, expect, it } from "vitest";
import { computeShopStats, returnRatePercent } from "./shop-stats";

const NOW = new Date("2026-11-10T12:00:00Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

describe("computeShopStats", () => {
  it("separates scanners, first-timers, returning and active customers", () => {
    const stats = computeShopStats(
      [
        { lifetime_stamps: 0, redemptions: 0, last_stamped_at: null }, // scanned the sign, never bought
        { lifetime_stamps: 1, redemptions: 0, last_stamped_at: daysAgo(40) }, // one visit, long ago
        { lifetime_stamps: 2, redemptions: 0, last_stamped_at: daysAgo(3) }, // came back, recently
        { lifetime_stamps: 11, redemptions: 1, last_stamped_at: daysAgo(30) }, // regular, exactly 30 days
      ],
      NOW,
    );

    expect(stats).toEqual({
      totalCards: 4,
      totalStampsGiven: 14,
      totalRedemptions: 1,
      stampedCustomers: 3,
      returningCustomers: 2,
      activeCustomers: 2,
    });
  });

  it("is all zeros for a brand-new shop", () => {
    expect(computeShopStats([], NOW)).toMatchObject({ totalCards: 0, returningCustomers: 0, activeCustomers: 0 });
  });
});

describe("returnRatePercent", () => {
  it("is returning over stamped customers, rounded", () => {
    expect(returnRatePercent({ returningCustomers: 2, stampedCustomers: 3 })).toBe(67);
  });

  it("is null before anyone has a stamp", () => {
    expect(returnRatePercent({ returningCustomers: 0, stampedCustomers: 0 })).toBeNull();
  });
});

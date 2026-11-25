import { describe, expect, it } from "vitest";
import { weeklyTrends } from "./trends";

const NOW = new Date("2026-11-25T12:00:00Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const event = (kind: string, days: number, stamps = 1, undone = false) => ({
  kind,
  created_at: daysAgo(days),
  undone_at: undone ? daysAgo(days) : null,
  stamps_added: stamps,
});

describe("weeklyTrends", () => {
  it("buckets into rolling weeks, oldest first", () => {
    const weeks = weeklyTrends(
      [event("stamp", 1, 2), event("stamp", 2, 1), event("redeem", 3), event("stamp", 8, 3)],
      [daysAgo(1), daysAgo(9), daysAgo(10)],
      NOW,
      3,
    );
    expect(weeks.map((week) => week.weeksAgo)).toEqual([2, 1, 0]);
    expect(weeks[2]).toEqual({ weeksAgo: 0, visits: 2, stamps: 3, newCustomers: 1, rewardsUsed: 1 });
    expect(weeks[1]).toEqual({ weeksAgo: 1, visits: 1, stamps: 3, newCustomers: 2, rewardsUsed: 0 });
    expect(weeks[0]).toEqual({ weeksAgo: 2, visits: 0, stamps: 0, newCustomers: 0, rewardsUsed: 0 });
  });

  it("ignores undone events, adjustments and anything outside the window", () => {
    const weeks = weeklyTrends([event("stamp", 1, 5, true), event("adjust", 1, 3), event("stamp", 40)], [], NOW, 2);
    expect(weeks.every((week) => week.visits === 0 && week.stamps === 0)).toBe(true);
  });
});

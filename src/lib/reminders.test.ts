import { describe, expect, it } from "vitest";
import { reminderLists } from "./reminders";

const NOW = new Date("2026-11-25T12:00:00Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const row = (phone: string, overrides: Partial<Parameters<typeof reminderLists>[0][number]> = {}) => ({
  phone,
  stamps_earned: 2,
  stamps_required: 9,
  redemptions: 0,
  rewards_used: 0,
  visits: 3,
  last_stamped_at: daysAgo(2),
  ...overrides,
});

describe("reminderLists", () => {
  it("finds customers one stamp away, with a reward waiting, and lapsed regulars", () => {
    const lists = reminderLists(
      [
        row("+218910000001", { stamps_earned: 8 }),
        row("+218910000002", { redemptions: 2, rewards_used: 1 }),
        row("+218910000003", { last_stamped_at: daysAgo(45) }),
        row("+218910000004", { visits: 1, last_stamped_at: daysAgo(45) }), // one-off visitor, not a lapsed regular
        row("+218910000005"),
      ],
      NOW,
    );
    expect(lists.oneAway.map((c) => c.phone)).toEqual(["+218910000001"]);
    expect(lists.rewardWaiting.map((c) => c.phone)).toEqual(["+218910000002"]);
    expect(lists.lapsed.map((c) => c.phone)).toEqual(["+218910000003"]);
  });
});

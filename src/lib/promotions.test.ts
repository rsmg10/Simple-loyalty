import { describe, expect, it } from "vitest";
import { isDoubleStampDay, isValidWeekdayList, weekdayIn } from "./promotions";

describe("weekdayIn", () => {
  it("uses the shop's own timezone, not the server's", () => {
    // 23:30 UTC on Thursday is already Friday 01:30 in Tripoli (UTC+2).
    const lateThursdayUtc = new Date("2026-11-26T23:30:00Z");
    expect(weekdayIn("UTC", lateThursdayUtc)).toBe(4);
    expect(weekdayIn("Africa/Tripoli", lateThursdayUtc)).toBe(5);
  });
});

describe("isDoubleStampDay", () => {
  it("matches the configured weekdays", () => {
    const friday = new Date("2026-11-27T10:00:00Z");
    expect(isDoubleStampDay([5], "Africa/Tripoli", friday)).toBe(true);
    expect(isDoubleStampDay([0, 6], "Africa/Tripoli", friday)).toBe(false);
    expect(isDoubleStampDay([], "Africa/Tripoli", friday)).toBe(false);
  });
});

describe("isValidWeekdayList", () => {
  it("accepts distinct weekdays 0–6 only", () => {
    expect(isValidWeekdayList([])).toBe(true);
    expect(isValidWeekdayList([5, 6])).toBe(true);
    expect(isValidWeekdayList([7])).toBe(false);
    expect(isValidWeekdayList([5, 5])).toBe(false);
    expect(isValidWeekdayList(["5"])).toBe(false);
    expect(isValidWeekdayList("5")).toBe(false);
  });
});

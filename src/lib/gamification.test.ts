import { describe, expect, it } from "vitest";
import { getEncouragementCopy } from "./gamification";

describe("getEncouragementCopy", () => {
  it("shows the 'so close' copy at exactly 1 remaining", () => {
    expect(getEncouragementCopy(8, 9)).toBe("So close! 1 more stamp and your next coffee is free.");
  });

  it("shows the starting copy at 0 stamps earned", () => {
    expect(getEncouragementCopy(0, 9)).toBe("9 stamps until your next coffee is free.");
  });

  it("shows the halfway copy at or above 50% progress", () => {
    expect(getEncouragementCopy(5, 9)).toBe("Halfway there! 4 more stamps until your next coffee is free.");
  });

  it("shows plain progress copy below 50% and above 0", () => {
    expect(getEncouragementCopy(2, 9)).toBe("7 more stamps until your next coffee is free.");
  });

  it("renders the same states in Arabic with correct plurals", () => {
    expect(getEncouragementCopy(8, 9, "ar")).toBe("اقتربت! ختم واحد فقط وتكون قهوتك القادمة مجانية.");
    expect(getEncouragementCopy(7, 9, "ar")).toBe("وصلت إلى المنتصف! تبقّى ختمان على قهوتك المجانية القادمة.");
    expect(getEncouragementCopy(0, 9, "ar")).toBe("تبقّى 9 أختام على قهوتك المجانية القادمة.");
  });
});

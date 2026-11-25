import { describe, expect, it } from "vitest";
import { applyStamp, applyStamps, maskEmail, toCardJson } from "./card-json";

describe("applyStamp", () => {
  it("increments stamps without touching redemptions below the threshold", () => {
    const result = applyStamp({ stamps_earned: 3, stamps_required: 9, redemptions: 0 });
    expect(result).toEqual({ stamps_earned: 4, redemptions: 0 });
  });

  it("rolls over to a redemption and resets stamps at the threshold", () => {
    const result = applyStamp({ stamps_earned: 8, stamps_required: 9, redemptions: 0 });
    expect(result).toEqual({ stamps_earned: 0, redemptions: 1 });
  });

  it("keeps incrementing redemptions across repeated full cards", () => {
    let card = { stamps_earned: 0, stamps_required: 3, redemptions: 0 };
    for (let i = 0; i < 9; i++) {
      card = { ...card, ...applyStamp(card) };
    }
    // 9 stamps over a 3-stamp card = exactly 3 completed redemptions, back at 0.
    expect(card).toMatchObject({ stamps_earned: 0, redemptions: 3 });
  });
});

describe("applyStamps", () => {
  it("adds several stamps below the threshold", () => {
    expect(applyStamps({ stamps_earned: 2, stamps_required: 9, redemptions: 0 }, 3)).toEqual({
      stamps_earned: 5,
      redemptions: 0,
    });
  });

  it("completes the card and carries the rest onto the next one", () => {
    // 8/9 + 3: the first stamp completes the card, two carry over.
    expect(applyStamps({ stamps_earned: 8, stamps_required: 9, redemptions: 1 }, 3)).toEqual({
      stamps_earned: 2,
      redemptions: 2,
    });
  });

  it("can complete more than one card in a single purchase", () => {
    expect(applyStamps({ stamps_earned: 2, stamps_required: 3, redemptions: 0 }, 7)).toEqual({
      stamps_earned: 0,
      redemptions: 3,
    });
  });

  it("matches applyStamp for a single stamp", () => {
    const card = { stamps_earned: 8, stamps_required: 9, redemptions: 0 };
    expect(applyStamps(card, 1)).toEqual(applyStamp(card));
  });
});

describe("rewardsAvailable", () => {
  const base = { id: "c", shop_id: "s", stamps_earned: 0, stamps_required: 9, last_seen_redemptions: 0, email: null };

  it("is rewards earned minus rewards handed over", () => {
    expect(toCardJson({ ...base, redemptions: 3, rewards_used: 1 }).rewardsAvailable).toBe(2);
  });

  it("is zero for rows read before saved rewards existed", () => {
    expect(toCardJson({ ...base, redemptions: 3 }).rewardsAvailable).toBe(0);
  });
});

describe("maskEmail", () => {
  it("keeps the first letter and the domain", () => {
    expect(maskEmail("ahmed@gmail.com")).toBe("a•••@gmail.com");
  });

  it("handles malformed values without leaking them", () => {
    expect(maskEmail("@gmail.com")).toBe("•••");
    expect(maskEmail("nodomain")).toBe("•••");
  });
});

describe("toCardJson", () => {
  it("never returns the full email or phone number", () => {
    const json = toCardJson({
      id: "card-1",
      shop_id: "shop-1",
      stamps_earned: 0,
      stamps_required: 9,
      redemptions: 0,
      last_seen_redemptions: 0,
      email: "ahmed@gmail.com",
      phone: "+218912345678",
    });
    expect(json).toMatchObject({ emailHint: "a•••@gmail.com", phoneHint: "••• 678" });
    expect(JSON.stringify(json)).not.toContain("ahmed");
    expect(JSON.stringify(json)).not.toContain("912345");
  });

  it("maps snake_case DB columns to camelCase and normalizes a null email", () => {
    const json = toCardJson({
      id: "card-1",
      shop_id: "shop-1",
      stamps_earned: 2,
      stamps_required: 9,
      redemptions: 0,
      last_seen_redemptions: 0,
      email: null,
    });

    expect(json).toEqual({
      id: "card-1",
      stampsEarned: 2,
      stampsRequired: 9,
      redemptions: 0,
      rewardsAvailable: 0,
      lastSeenRedemptions: 0,
      emailHint: undefined,
    });
  });
});

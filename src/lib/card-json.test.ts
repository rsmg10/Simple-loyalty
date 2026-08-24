import { describe, expect, it } from "vitest";
import { applyStamp, toCardJson } from "./card-json";

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

describe("toCardJson", () => {
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
      lastSeenRedemptions: 0,
      email: undefined,
    });
  });
});

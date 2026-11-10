import { describe, expect, it } from "vitest";
import { buildWebManifest } from "./web-manifest";

const CARD_ID = "86454e65-82ce-4120-bec3-b43ab2cd20a3";

describe("buildWebManifest", () => {
  it("launches the customer's own card from the home screen", () => {
    expect(buildWebManifest({ shopName: "Cafe", locale: "ar", cardId: CARD_ID }).start_url).toBe(`/?card=${CARD_ID}`);
  });

  it("ignores anything that isn't a card id", () => {
    expect(buildWebManifest({ shopName: "Cafe", locale: "en", cardId: "x&evil=1" }).start_url).toBe("/");
    expect(buildWebManifest({ shopName: "Cafe", locale: "en", cardId: null }).start_url).toBe("/");
  });

  it("keeps one app identity whatever the card", () => {
    expect(buildWebManifest({ shopName: "Cafe", locale: "en", cardId: CARD_ID }).id).toBe("/");
  });

  it("carries the PNG icon sizes Chrome requires to offer an install", () => {
    const sizes = buildWebManifest({ shopName: "Cafe", locale: "en", cardId: null }).icons?.map((icon) => icon.sizes);
    expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  });

  it("follows the deployment's language direction", () => {
    expect(buildWebManifest({ shopName: "Cafe", locale: "ar", cardId: null })).toMatchObject({ lang: "ar", dir: "rtl" });
  });
});

import { describe, expect, it } from "vitest";
import { MAX_LOGO_BYTES, isValidBrandColor, parseLogoDataUrl } from "./logo";

const png = (bytes: number) => `data:image/png;base64,${Buffer.alloc(bytes, 1).toString("base64")}`;

describe("parseLogoDataUrl", () => {
  it("accepts small PNG/JPEG/WebP data URLs", () => {
    expect(parseLogoDataUrl(png(100))).toMatchObject({ contentType: "image/png" });
    expect(parseLogoDataUrl(png(100).replace("png", "webp"))).toMatchObject({ contentType: "image/webp" });
  });

  it("rejects other types, oversize images and junk", () => {
    expect(parseLogoDataUrl(png(100).replace("png", "svg+xml"))).toBeNull(); // SVG can carry scripts
    expect(parseLogoDataUrl(png(MAX_LOGO_BYTES + 1))).toBeNull();
    expect(parseLogoDataUrl("https://example.com/logo.png")).toBeNull();
    expect(parseLogoDataUrl(42)).toBeNull();
  });
});

describe("isValidBrandColor", () => {
  it("accepts #rrggbb only", () => {
    expect(isValidBrandColor("#1a3a3a")).toBe(true);
    expect(isValidBrandColor("1a3a3a")).toBe(false);
    expect(isValidBrandColor("#fff")).toBe(false);
    expect(isValidBrandColor("red; background:url(x)")).toBe(false);
  });
});

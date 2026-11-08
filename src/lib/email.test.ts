import { describe, expect, it } from "vitest";
import { buildFromHeader } from "./email";

describe("buildFromHeader", () => {
  it("uses the shop name as the display name with the configured address", () => {
    expect(buildFromHeader("Cafe Meridian", "hello@cafe.com")).toBe('"Cafe Meridian" <hello@cafe.com>');
  });

  it("falls back to Resend's sandbox address when none is configured", () => {
    expect(buildFromHeader("Cafe Meridian", undefined)).toBe('"Cafe Meridian" <onboarding@resend.dev>');
  });

  it("strips characters that could break out of the quoted display name", () => {
    expect(buildFromHeader('Joe"s <Cafe>\r\n', "hello@cafe.com")).toBe('"Joes Cafe" <hello@cafe.com>');
  });

  it("uses a generic display name if the shop name is empty after cleaning", () => {
    expect(buildFromHeader('<>"', "hello@cafe.com")).toBe('"Loyalty Card" <hello@cafe.com>');
  });
});

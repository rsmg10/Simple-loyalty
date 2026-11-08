import { describe, expect, it } from "vitest";
import { isValidSlug, resolveShopSlug, slugify } from "./tenant";

describe("resolveShopSlug", () => {
  it("extracts the subdomain label as the slug", () => {
    expect(resolveShopSlug("cafe-meridian.yourapp.com", "yourapp.com")).toBe("cafe-meridian");
  });

  it("strips the port before resolving", () => {
    expect(resolveShopSlug("cafe-meridian.yourapp.com:3000", "yourapp.com")).toBe("cafe-meridian");
  });

  it("returns null for the bare root domain", () => {
    expect(resolveShopSlug("yourapp.com", "yourapp.com")).toBeNull();
  });

  it("returns null for www", () => {
    expect(resolveShopSlug("www.yourapp.com", "yourapp.com")).toBeNull();
  });

  it("returns null for a host that doesn't end with the root domain", () => {
    expect(resolveShopSlug("evil.com", "yourapp.com")).toBeNull();
  });

  it("returns null for a multi-level subdomain rather than guessing", () => {
    expect(resolveShopSlug("a.b.yourapp.com", "yourapp.com")).toBeNull();
  });

  it("returns null for any host when rootDomain is unset — the Model A backward-compat guarantee", () => {
    expect(resolveShopSlug("cafe-meridian.yourapp.com", undefined)).toBeNull();
    expect(resolveShopSlug("localhost:3001", undefined)).toBeNull();
  });
});

describe("isValidSlug", () => {
  it("accepts a normal lowercase hyphenated slug", () => {
    expect(isValidSlug("cafe-meridian")).toBe(true);
  });

  it("rejects slugs shorter than 3 characters", () => {
    expect(isValidSlug("ab")).toBe(false);
    expect(isValidSlug("a")).toBe(false);
  });

  it("rejects a slug starting or ending with a hyphen", () => {
    expect(isValidSlug("-cafe")).toBe(false);
    expect(isValidSlug("cafe-")).toBe(false);
  });

  it("rejects uppercase and non-alphanumeric characters", () => {
    expect(isValidSlug("Cafe")).toBe(false);
    expect(isValidSlug("cafe_meridian")).toBe(false);
    expect(isValidSlug("cafe.meridian")).toBe(false);
  });

  it("rejects www — resolveShopSlug would never let it resolve", () => {
    expect(isValidSlug("www")).toBe(false);
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates a shop name", () => {
    expect(slugify("Cafe Meridian")).toBe("cafe-meridian");
  });

  it("collapses runs of non-alphanumeric characters into one hyphen", () => {
    expect(slugify("Joe's   Coffee & Tea!!")).toBe("joe-s-coffee-tea");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --Cafe--  ")).toBe("cafe");
  });
});

import { describe, expect, it } from "vitest";
import { resolveShopSlug } from "./tenant";

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

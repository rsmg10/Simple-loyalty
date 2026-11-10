import { describe, expect, it } from "vitest";
import { dirFor, resolveLocale } from "./locale";
import { messages, pluralStampsAr } from "./messages";

describe("resolveLocale", () => {
  it("prefers the viewer's cookie", () => {
    expect(resolveLocale("en", "ar")).toBe("en");
    expect(resolveLocale("ar", "en")).toBe("ar");
  });

  it("falls back to the deployment default, then English", () => {
    expect(resolveLocale(undefined, "ar")).toBe("ar");
    expect(resolveLocale(undefined, undefined)).toBe("en");
  });

  it("ignores unsupported values", () => {
    expect(resolveLocale("fr", "de")).toBe("en");
  });
});

describe("dirFor", () => {
  it("is right-to-left only for Arabic", () => {
    expect(dirFor("ar")).toBe("rtl");
    expect(dirFor("en")).toBe("ltr");
  });
});

describe("pluralStampsAr", () => {
  it.each([
    [1, "ختم واحد"],
    [2, "ختمان"],
    [3, "3 أختام"],
    [9, "9 أختام"],
    [10, "10 أختام"],
    [11, "11 ختمًا"],
    [20, "20 ختمًا"],
  ])("%i → %s", (count, expected) => {
    expect(pluralStampsAr(count)).toBe(expected);
  });
});

describe("messages", () => {
  // TypeScript already forces both dictionaries to the same shape; this
  // catches an Arabic entry accidentally left as an empty string.
  function leaves(value: unknown, path = ""): [string, unknown][] {
    if (value && typeof value === "object") {
      return Object.entries(value).flatMap(([key, child]) => leaves(child, `${path}.${key}`));
    }
    return [[path, value]];
  }

  it("has no empty strings in either language", () => {
    for (const locale of ["en", "ar"] as const) {
      for (const [path, value] of leaves(messages[locale])) {
        if (typeof value === "string") expect(value, `${locale}${path}`).not.toBe("");
      }
    }
  });

  it("renders Arabic signage copy with the correct plural", () => {
    expect(messages.ar.signage.reward(9)).toBe("قهوة مجانية بعد 9 أختام");
    expect(messages.ar.signage.reward(12)).toBe("قهوة مجانية بعد 12 ختمًا");
  });
});

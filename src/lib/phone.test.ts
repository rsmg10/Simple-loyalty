import { afterEach, describe, expect, it } from "vitest";
import { defaultPhoneCountryCode, maskPhone, normalizePhone, toAsciiDigits } from "./phone";

describe("normalizePhone (Libya default)", () => {
  it.each([
    ["0912345678", "+218912345678"],
    ["091 234 5678", "+218912345678"],
    ["091-234-5678", "+218912345678"],
    ["912345678", "+218912345678"],
    ["218912345678", "+218912345678"],
    ["+218 91 234 5678", "+218912345678"],
    ["00218912345678", "+218912345678"],
    ["(092) 123-4567", "+218921234567"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it("accepts Arabic-Indic digits from an Arabic keyboard", () => {
    expect(normalizePhone("٠٩١٢٣٤٥٦٧٨")).toBe("+218912345678");
    expect(normalizePhone("۰۹۱۲۳۴۵۶۷۸")).toBe("+218912345678");
  });

  it.each([
    ["", "empty"],
    ["abc", "letters"],
    ["09123", "too short"],
    ["09123456789", "a digit too many for a Libyan mobile"],
    ["0212345678", "a Libyan landline"],
    ["+218 91 234 567x", "trailing letter"],
    ["091+2345678", "plus sign in the middle"],
  ])("rejects %s (%s)", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });

  it("keeps foreign numbers given in international form", () => {
    expect(normalizePhone("+44 7700 900123")).toBe("+447700900123");
    expect(normalizePhone("0044 7700 900123")).toBe("+447700900123");
  });

  it("uses another country code for national numbers when configured", () => {
    expect(normalizePhone("07700 900123", "44")).toBe("+447700900123");
  });
});

describe("defaultPhoneCountryCode", () => {
  afterEach(() => {
    delete process.env.PHONE_COUNTRY_CODE;
  });

  it("defaults to Libya", () => {
    expect(defaultPhoneCountryCode()).toBe("218");
  });

  it("reads PHONE_COUNTRY_CODE, with or without a leading +", () => {
    process.env.PHONE_COUNTRY_CODE = "+44";
    expect(defaultPhoneCountryCode()).toBe("44");
  });

  it("ignores a malformed value", () => {
    process.env.PHONE_COUNTRY_CODE = "uk";
    expect(defaultPhoneCountryCode()).toBe("218");
  });
});

describe("toAsciiDigits", () => {
  it("leaves non-digit characters alone", () => {
    expect(toAsciiDigits("+٢١٨ ٩١")).toBe("+218 91");
  });
});

describe("maskPhone", () => {
  it("shows only the last three digits", () => {
    expect(maskPhone("+218912345678")).toBe("••• 678");
  });
});

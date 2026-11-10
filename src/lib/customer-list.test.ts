import { describe, expect, it } from "vitest";
import { toCustomerList, whatsAppUrl } from "./customer-list";

const row = (phone: string, lastStampedAt: string | null) => ({
  phone,
  lifetime_stamps: 3,
  stamps_earned: 3,
  stamps_required: 9,
  last_stamped_at: lastStampedAt,
});

describe("toCustomerList", () => {
  it("puts the most recent visitors first and never-stamped customers last", () => {
    const list = toCustomerList([
      row("+218910000001", null),
      row("+218910000002", "2026-11-01T10:00:00Z"),
      row("+218910000003", "2026-11-09T10:00:00Z"),
    ]);
    expect(list.map((customer) => customer.phone)).toEqual(["+218910000003", "+218910000002", "+218910000001"]);
  });

  it("maps columns to camelCase", () => {
    expect(toCustomerList([row("+218910000001", null)])[0]).toEqual({
      phone: "+218910000001",
      lifetimeStamps: 3,
      stampsEarned: 3,
      stampsRequired: 9,
      lastStampedAt: null,
    });
  });
});

describe("whatsAppUrl", () => {
  it("uses bare digits", () => {
    expect(whatsAppUrl("+218912345678")).toBe("https://wa.me/218912345678");
  });

  it("pre-fills an encoded message, ignoring blank ones", () => {
    expect(whatsAppUrl("+218912345678", "أختام مضاعفة!")).toBe(
      `https://wa.me/218912345678?text=${encodeURIComponent("أختام مضاعفة!")}`,
    );
    expect(whatsAppUrl("+218912345678", "   ")).toBe("https://wa.me/218912345678");
  });
});

// Phone numbers are stored in E.164 (`+218912345678`) so the same customer
// matches whether staff type "091 234 5678", "+218 91-234-5678" or the
// number in Arabic-Indic digits from an Arabic keyboard.

const DEFAULT_COUNTRY_CODE = "218"; // Libya
const LIBYA_MOBILE = /^2189\d{8}$/;

export function defaultPhoneCountryCode(): string {
  const configured = process.env.PHONE_COUNTRY_CODE?.replace(/^\+/, "");
  return configured && /^\d{1,3}$/.test(configured) ? configured : DEFAULT_COUNTRY_CODE;
}

// ٠-٩ (Arabic-Indic) and ۰-۹ (Extended Arabic-Indic / Persian) → 0-9.
export function toAsciiDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

export function normalizePhone(input: string, countryCode: string = DEFAULT_COUNTRY_CODE): string | null {
  const ascii = toAsciiDigits(input.trim());
  if (!/^\+?[\d\s\-().]+$/.test(ascii)) return null;

  const hasPlus = ascii.startsWith("+");
  const digits = ascii.replace(/\D/g, "");

  let international: string;
  if (hasPlus) {
    international = digits;
  } else if (digits.startsWith("00")) {
    international = digits.slice(2);
  } else if (digits.startsWith("0")) {
    international = countryCode + digits.slice(1);
  } else if (digits.startsWith(countryCode) && digits.length >= countryCode.length + 8) {
    international = digits;
  } else {
    international = countryCode + digits;
  }

  if (!/^\d{8,15}$/.test(international)) return null;
  // Catches the typo'd/short numbers staff and customers will actually
  // type, for the market this is built for. Other countries only get the
  // generic E.164 length check above.
  if (international.startsWith("218") && !LIBYA_MOBILE.test(international)) return null;

  return `+${international}`;
}

// Enough for a customer to recognise their own number without the full
// number ever leaving the server.
export function maskPhone(e164: string): string {
  return `••• ${e164.slice(-3)}`;
}

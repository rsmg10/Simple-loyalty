// Café logos are small images stored in the database as data URLs (the
// setup page shrinks them to 256px before upload) — no separate file
// storage to run. Served by /api/shop/logo.

export const MAX_LOGO_BYTES = 150 * 1024;
const DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

export function parseLogoDataUrl(value: unknown): { contentType: string; bytes: Buffer } | null {
  if (typeof value !== "string") return null;
  const match = DATA_URL.exec(value);
  if (!match) return null;
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length === 0 || bytes.length > MAX_LOGO_BYTES) return null;
  return { contentType: match[1], bytes };
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function isValidBrandColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

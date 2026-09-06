import crypto from "node:crypto";
import { JWT } from "google-auth-library";

export type GoogleWalletCardInput = {
  cardId: string;
  stampsEarned: number;
  stampsRequired: number;
  shopName: string;
};

type GoogleWalletEnv = {
  issuerId: string;
  serviceAccountEmail: string;
  privateKey: string;
};

const WALLET_API_BASE = "https://walletobjects.googleapis.com/walletobjects/v1";
const WALLET_SCOPE = "https://www.googleapis.com/auth/wallet_object.issuer";

function readEnv(): GoogleWalletEnv | null {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY;
  if (!issuerId || !serviceAccountEmail || !rawKey) return null;

  // Service-account keys are commonly stored as an env var with literal
  // "\n" escapes standing in for real newlines (same convention as Firebase
  // Admin SDK env vars) since most hosting UIs mangle real newlines.
  return { issuerId, serviceAccountEmail, privateKey: rawKey.replace(/\\n/g, "\n") };
}

export function isGoogleWalletConfigured(): boolean {
  return readEnv() !== null;
}

// Single-shop MVP — one loyalty class for the one seeded shop. Keep this in
// sync with scripts/setup-google-wallet-class.mjs, which provisions the
// class this id points at.
export function googleWalletClassId(issuerId: string): string {
  return `${issuerId}.loyalty_class`;
}

export function googleWalletObjectId(issuerId: string, cardId: string): string {
  // Object ids may only contain alphanumeric characters, '.', '_', '-'.
  return `${issuerId}.card_${cardId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

function buildLoyaltyObject(env: GoogleWalletEnv, input: GoogleWalletCardInput) {
  return {
    id: googleWalletObjectId(env.issuerId, input.cardId),
    classId: googleWalletClassId(env.issuerId),
    state: "ACTIVE",
    accountId: input.cardId,
    accountName: input.shopName,
    loyaltyPoints: {
      label: "Stamps",
      balance: { string: `${input.stampsEarned} / ${input.stampsRequired}` },
    },
    barcode: { type: "QR_CODE", value: input.cardId },
  };
}

function base64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

// The object is embedded directly in the JWT (not just referenced by id) so
// that clicking "Add to Google Wallet" works even before upsertGoogleWalletObject
// has ever run for this card — Google creates the object from the JWT
// payload on first save.
export async function getGoogleWalletSaveUrl(input: GoogleWalletCardInput): Promise<string> {
  const env = readEnv();
  if (!env) throw new Error("Google Wallet is not configured");

  const claims = {
    iss: env.serviceAccountEmail,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    payload: { loyaltyObjects: [buildLoyaltyObject(env, input)] },
  };
  const header = { alg: "RS256", typ: "JWT" };

  const signingInput = `${base64url(header)}.${base64url(claims)}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(signingInput)
    .sign(env.privateKey, "base64url");

  return `https://pay.google.com/gp/v/save/${signingInput}.${signature}`;
}

// Fire-and-forget from the stamp route, same as the reminder email — a
// customer who added the pass sees their stamp count update live (Google
// hosts pass state, unlike Apple's static v1 pass) but a failure here must
// never block the staff-facing stamp action.
export async function upsertGoogleWalletObject(input: GoogleWalletCardInput): Promise<void> {
  const env = readEnv();
  if (!env) return;

  const client = new JWT({
    email: env.serviceAccountEmail,
    key: env.privateKey,
    scopes: [WALLET_SCOPE],
  });
  const loyaltyObject = buildLoyaltyObject(env, input);

  try {
    await client.request({
      url: `${WALLET_API_BASE}/loyaltyObject/${loyaltyObject.id}`,
      method: "PATCH",
      data: loyaltyObject,
    });
  } catch (error) {
    if (!isNotFound(error)) throw error;
    // Object doesn't exist yet — this is the card's first stamp since the
    // shop's Wallet integration was configured. Create it instead.
    await client.request({
      url: `${WALLET_API_BASE}/loyaltyObject`,
      method: "POST",
      data: loyaltyObject,
    });
  }
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 404
  );
}

import crypto from "node:crypto";
import { JWT } from "google-auth-library";

export type GoogleWalletCardInput = {
  cardId: string;
  shopId: string;
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

// Ids may only contain alphanumeric characters, '.', '_', '-'.
function sanitizeIdPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

// One loyalty class per shop, so each shop's passes carry its own name.
// Classes are created on demand by ensureGoogleWalletClass().
export function googleWalletClassId(issuerId: string, shopId: string): string {
  return `${issuerId}.shop_${sanitizeIdPart(shopId)}`;
}

export function googleWalletObjectId(issuerId: string, cardId: string): string {
  return `${issuerId}.card_${sanitizeIdPart(cardId)}`;
}

export function buildLoyaltyClass(
  env: Pick<GoogleWalletEnv, "issuerId">,
  shop: { shopId: string; shopName: string },
  appUrl: string | undefined,
) {
  return {
    id: googleWalletClassId(env.issuerId, shop.shopId),
    issuerName: shop.shopName,
    programName: `${shop.shopName} Loyalty Card`,
    hexBackgroundColor: "#0a0a0a",
    // Shared placeholder logo (public/wallet/google-logo.png) for every shop
    // for now; Google fetches it from this public URL.
    programLogo: { sourceUri: { uri: `${appUrl ?? ""}/wallet/google-logo.png` } },
  };
}

function buildLoyaltyObject(env: GoogleWalletEnv, input: GoogleWalletCardInput) {
  return {
    id: googleWalletObjectId(env.issuerId, input.cardId),
    classId: googleWalletClassId(env.issuerId, input.shopId),
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
// that clicking "Add to Google Wallet" works for a card whose pass has never
// been created — Google creates the object from the JWT payload on first
// save. The shop's class must already exist: call ensureGoogleWalletClass()
// first.
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

function getClient(env: GoogleWalletEnv) {
  return new JWT({ email: env.serviceAccountEmail, key: env.privateKey, scopes: [WALLET_SCOPE] });
}

// classId -> shop name it was last confirmed with. Per server instance, so a
// cold start re-checks once; a changed shop name is picked up the next time.
const ensuredClasses = new Map<string, string>();

// Makes sure this shop's loyalty class exists (and carries the shop's
// current name), creating it on first use. This replaces a manual
// per-shop provisioning step: a shop gets its class the first time a
// customer taps "Add to Google Wallet".
//
// New classes start UNDER_REVIEW; while the issuer is in demo mode only
// test users can save passes regardless. Existing classes are never sent a
// reviewStatus, so an already-approved class isn't pushed back into review.
export async function ensureGoogleWalletClass(shop: { shopId: string; shopName: string }): Promise<void> {
  const env = readEnv();
  if (!env) return;

  const desired = buildLoyaltyClass(env, shop, process.env.NEXT_PUBLIC_APP_URL);
  if (ensuredClasses.get(desired.id) === shop.shopName) return;

  const client = getClient(env);
  const url = `${WALLET_API_BASE}/loyaltyClass/${desired.id}`;

  let existing: { issuerName?: string; programName?: string };
  try {
    existing = (await client.request<{ issuerName?: string; programName?: string }>({ url, method: "GET" })).data;
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await client.request({
      url: `${WALLET_API_BASE}/loyaltyClass`,
      method: "POST",
      data: { ...desired, reviewStatus: "UNDER_REVIEW" },
    });
    ensuredClasses.set(desired.id, shop.shopName);
    return;
  }

  if (existing.issuerName !== desired.issuerName || existing.programName !== desired.programName) {
    await client.request({
      url,
      method: "PATCH",
      data: { issuerName: desired.issuerName, programName: desired.programName },
    });
  }
  ensuredClasses.set(desired.id, shop.shopName);
}

// Fire-and-forget from the stamp route, same as the reminder email — a
// customer who added the pass sees their stamp count update live (Google
// hosts pass state, unlike Apple's static v1 pass) but a failure here must
// never block the staff-facing stamp action.
//
// Update-only: a 404 means this customer never added the pass, so there is
// nothing to update (and nothing should be created — the save link's JWT
// creates the object if and when they do add it).
export async function updateGoogleWalletObject(input: GoogleWalletCardInput): Promise<void> {
  const env = readEnv();
  if (!env) return;

  const loyaltyObject = buildLoyaltyObject(env, input);

  try {
    await getClient(env).request({
      url: `${WALLET_API_BASE}/loyaltyObject/${loyaltyObject.id}`,
      method: "PATCH",
      data: loyaltyObject,
    });
  } catch (error) {
    if (!isNotFound(error)) throw error;
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

import { generateKeyPairSync, verify } from "node:crypto";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { getGoogleWalletSaveUrl, isGoogleWalletConfigured } from "./google-wallet";

const REQUIRED_KEYS = [
  "GOOGLE_WALLET_ISSUER_ID",
  "GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_WALLET_SERVICE_ACCOUNT_KEY",
] as const;

afterEach(() => {
  for (const key of REQUIRED_KEYS) delete process.env[key];
});

describe("isGoogleWalletConfigured", () => {
  it("is false when no env vars are set", () => {
    expect(isGoogleWalletConfigured()).toBe(false);
  });

  it("is true once all required env vars are set", () => {
    process.env.GOOGLE_WALLET_ISSUER_ID = "issuer-1";
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL = "svc@example.iam.gserviceaccount.com";
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY = "x";
    expect(isGoogleWalletConfigured()).toBe(true);
  });

  it("is false if any single required env var is missing", () => {
    process.env.GOOGLE_WALLET_ISSUER_ID = "issuer-1";
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL = "svc@example.iam.gserviceaccount.com";
    expect(isGoogleWalletConfigured()).toBe(false);
  });
});

describe("getGoogleWalletSaveUrl", () => {
  let publicKey: string;

  beforeAll(() => {
    const { privateKey, publicKey: pub } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs1", format: "pem" },
      publicKeyEncoding: { type: "pkcs1", format: "pem" },
    });
    publicKey = pub;

    process.env.GOOGLE_WALLET_ISSUER_ID = "3388000000012345678";
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL = "svc@example.iam.gserviceaccount.com";
    // Real service-account keys arrive with literal "\n" escapes (the
    // Firebase-style convention) — cover that path here too.
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY = privateKey.replace(/\n/g, "\\n");
  });

  it("returns a save URL whose JWT payload matches the card and verifies against the signing key", async () => {
    const url = await getGoogleWalletSaveUrl({
      cardId: "11111111-1111-1111-1111-111111111111",
      stampsEarned: 3,
      stampsRequired: 9,
      shopName: "Cafe Meridian",
    });

    expect(url.startsWith("https://pay.google.com/gp/v/save/")).toBe(true);
    const jwt = url.replace("https://pay.google.com/gp/v/save/", "");
    const [headerB64, payloadB64, signatureB64] = jwt.split(".");

    const signingInput = `${headerB64}.${payloadB64}`;
    const isValid = verify(
      "RSA-SHA256",
      Buffer.from(signingInput),
      publicKey,
      Buffer.from(signatureB64, "base64url"),
    );
    expect(isValid).toBe(true);

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    expect(payload.iss).toBe("svc@example.iam.gserviceaccount.com");
    expect(payload.typ).toBe("savetowallet");

    const loyaltyObject = payload.payload.loyaltyObjects[0];
    expect(loyaltyObject.classId).toBe("3388000000012345678.loyalty_class");
    expect(loyaltyObject.id).toBe(
      "3388000000012345678.card_11111111-1111-1111-1111-111111111111",
    );
    expect(loyaltyObject.loyaltyPoints.balance.string).toBe("3 / 9");
  });
});

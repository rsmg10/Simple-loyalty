import { generateKeyPairSync, verify } from "node:crypto";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildLoyaltyClass,
  ensureGoogleWalletClass,
  getGoogleWalletSaveUrl,
  googleWalletClassId,
  isGoogleWalletConfigured,
  updateGoogleWalletObject,
} from "./google-wallet";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("google-auth-library", () => ({
  JWT: class {
    request = request;
  },
}));

function httpError(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), { response: { status } });
}

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
      shopId: "22222222-2222-2222-2222-222222222222",
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
    expect(loyaltyObject.classId).toBe("3388000000012345678.shop_22222222-2222-2222-2222-222222222222");
    expect(loyaltyObject.id).toBe(
      "3388000000012345678.card_11111111-1111-1111-1111-111111111111",
    );
    expect(loyaltyObject.loyaltyPoints.balance.string).toBe("3 / 9");
  });
});

describe("googleWalletClassId", () => {
  it("is distinct per shop under the same issuer", () => {
    expect(googleWalletClassId("issuer", "shop-a")).not.toBe(googleWalletClassId("issuer", "shop-b"));
  });

  it("strips characters Google doesn't allow in ids", () => {
    expect(googleWalletClassId("issuer", "sh op/1!")).toBe("issuer.shop_shop1");
  });
});

describe("buildLoyaltyClass", () => {
  it("names the class after the shop and points the logo at the app's public URL", () => {
    const loyaltyClass = buildLoyaltyClass(
      { issuerId: "issuer" },
      { shopId: "shop-a", shopName: "Cafe Meridian" },
      "https://cafe.example.com",
    );
    expect(loyaltyClass).toMatchObject({
      id: "issuer.shop_shop-a",
      issuerName: "Cafe Meridian",
      programName: "Cafe Meridian Loyalty Card",
      programLogo: { sourceUri: { uri: "https://cafe.example.com/wallet/google-logo.png" } },
    });
  });
});

describe("with Google Wallet configured", () => {
  beforeEach(() => {
    request.mockReset();
    process.env.GOOGLE_WALLET_ISSUER_ID = "issuer";
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL = "svc@example.iam.gserviceaccount.com";
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY = "unused-requests-are-mocked";
  });

  describe("ensureGoogleWalletClass", () => {
    it("creates a missing class, in review, named after the shop", async () => {
      request.mockRejectedValueOnce(httpError(404)).mockResolvedValueOnce({ data: {} });

      await ensureGoogleWalletClass({ shopId: "create-case", shopName: "Cafe One" });

      expect(request).toHaveBeenCalledTimes(2);
      const create = request.mock.calls[1][0];
      expect(create.method).toBe("POST");
      expect(create.data).toMatchObject({
        id: "issuer.shop_create-case",
        issuerName: "Cafe One",
        reviewStatus: "UNDER_REVIEW",
      });
    });

    it("leaves an existing class alone when the name already matches", async () => {
      request.mockResolvedValueOnce({
        data: { issuerName: "Cafe Two", programName: "Cafe Two Loyalty Card" },
      });

      await ensureGoogleWalletClass({ shopId: "match-case", shopName: "Cafe Two" });

      expect(request).toHaveBeenCalledTimes(1);
      expect(request.mock.calls[0][0].method).toBe("GET");
    });

    it("patches only the names when the shop was renamed, never reviewStatus", async () => {
      request
        .mockResolvedValueOnce({ data: { issuerName: "Old Name", programName: "Old Name Loyalty Card" } })
        .mockResolvedValueOnce({ data: {} });

      await ensureGoogleWalletClass({ shopId: "rename-case", shopName: "New Name" });

      const patch = request.mock.calls[1][0];
      expect(patch.method).toBe("PATCH");
      expect(patch.data).toEqual({ issuerName: "New Name", programName: "New Name Loyalty Card" });
    });

    it("skips the API entirely once a class is confirmed for this name", async () => {
      request.mockResolvedValueOnce({
        data: { issuerName: "Cafe Four", programName: "Cafe Four Loyalty Card" },
      });

      await ensureGoogleWalletClass({ shopId: "cache-case", shopName: "Cafe Four" });
      await ensureGoogleWalletClass({ shopId: "cache-case", shopName: "Cafe Four" });

      expect(request).toHaveBeenCalledTimes(1);
    });

    it("surfaces non-404 errors instead of swallowing them", async () => {
      request.mockRejectedValueOnce(httpError(403));
      await expect(ensureGoogleWalletClass({ shopId: "err-case", shopName: "Cafe Five" })).rejects.toThrow("HTTP 403");
    });
  });

  describe("updateGoogleWalletObject", () => {
    const input = {
      cardId: "card-1",
      shopId: "shop-a",
      stampsEarned: 2,
      stampsRequired: 9,
      shopName: "Cafe Meridian",
    };

    it("patches the object's stamp count", async () => {
      request.mockResolvedValueOnce({ data: {} });
      await updateGoogleWalletObject(input);

      const call = request.mock.calls[0][0];
      expect(call.method).toBe("PATCH");
      expect(call.data.loyaltyPoints.balance.string).toBe("2 / 9");
    });

    it("does nothing (and creates nothing) if the customer never added the pass", async () => {
      request.mockRejectedValueOnce(httpError(404));
      await expect(updateGoogleWalletObject(input)).resolves.toBeUndefined();
      expect(request).toHaveBeenCalledTimes(1);
    });
  });
});

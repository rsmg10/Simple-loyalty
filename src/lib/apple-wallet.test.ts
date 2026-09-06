import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { generateApplePass, isAppleWalletConfigured } from "./apple-wallet";

const REQUIRED_KEYS = [
  "APPLE_PASS_TYPE_IDENTIFIER",
  "APPLE_TEAM_IDENTIFIER",
  "APPLE_PASS_SIGNER_CERT_BASE64",
  "APPLE_PASS_SIGNER_KEY_BASE64",
] as const;

afterEach(() => {
  for (const key of REQUIRED_KEYS) delete process.env[key];
});

describe("isAppleWalletConfigured", () => {
  it("is false when no env vars are set", () => {
    expect(isAppleWalletConfigured()).toBe(false);
  });

  it("is true once all required env vars are set", () => {
    for (const key of REQUIRED_KEYS) process.env[key] = "x";
    expect(isAppleWalletConfigured()).toBe(true);
  });

  it("is false if any single required env var is missing", () => {
    for (const key of REQUIRED_KEYS) process.env[key] = "x";
    delete process.env.APPLE_TEAM_IDENTIFIER;
    expect(isAppleWalletConfigured()).toBe(false);
  });
});

describe("generateApplePass", () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdtempSync(path.join(tmpdir(), "apple-wallet-test-"));
    const keyPath = path.join(tmpDir, "key.pem");
    const certPath = path.join(tmpDir, "cert.pem");

    // A throwaway self-signed cert — enough to exercise the pkpass signing
    // code path structurally. A real device won't trust it (only an
    // Apple-issued Pass Type ID cert chains to the WWDR root bundled in
    // certs/AppleWWDRCAG4.pem); that can only be verified with a real
    // Apple Developer certificate.
    execFileSync("openssl", [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-keyout",
      keyPath,
      "-out",
      certPath,
      "-days",
      "1",
      "-nodes",
      "-subj",
      "/CN=Test Pass Signer",
    ]);

    process.env.APPLE_PASS_TYPE_IDENTIFIER = "pass.com.example.test";
    process.env.APPLE_TEAM_IDENTIFIER = "TESTTEAM1";
    process.env.APPLE_PASS_SIGNER_CERT_BASE64 = readFileSync(certPath).toString("base64");
    process.env.APPLE_PASS_SIGNER_KEY_BASE64 = readFileSync(keyPath).toString("base64");
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("produces a non-empty, zip-formatted .pkpass buffer", async () => {
    const buffer = await generateApplePass({
      cardId: "11111111-1111-1111-1111-111111111111",
      stampsEarned: 3,
      stampsRequired: 9,
      shopName: "Cafe Meridian",
    });

    expect(buffer.length).toBeGreaterThan(1000);
    // Zip local file header magic bytes ("PK\x03\x04").
    expect(buffer.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  });
});

import { readFileSync } from "node:fs";
import path from "node:path";
import { PKPass } from "passkit-generator";

export type ApplePassInput = {
  cardId: string;
  stampsEarned: number;
  stampsRequired: number;
  shopName: string;
};

const REQUIRED_ENV_VARS = [
  "APPLE_PASS_TYPE_IDENTIFIER",
  "APPLE_TEAM_IDENTIFIER",
  "APPLE_PASS_SIGNER_CERT_BASE64",
  "APPLE_PASS_SIGNER_KEY_BASE64",
] as const;

export function isAppleWalletConfigured(): boolean {
  return REQUIRED_ENV_VARS.every((key) => !!process.env[key]);
}

const WALLET_IMAGE_DIR = path.join(process.cwd(), "public", "wallet");
const WWDR_CERT_PATH = path.join(process.cwd(), "certs", "AppleWWDRCAG4.pem");

// v1 ships a static pass: it reflects the stamp count at download time but
// won't auto-update afterward. Auto-updating requires a device-registration
// web service + APNs push, which is a separate, materially bigger piece of
// infrastructure — deferred until there's a real Apple cert to test it
// against. Customers can always re-add the pass to refresh the count.
export async function generateApplePass(input: ApplePassInput): Promise<Buffer> {
  if (!isAppleWalletConfigured()) {
    throw new Error("Apple Wallet is not configured");
  }

  const pass = new PKPass(
    {
      "icon.png": readFileSync(path.join(WALLET_IMAGE_DIR, "icon.png")),
      "icon@2x.png": readFileSync(path.join(WALLET_IMAGE_DIR, "icon@2x.png")),
      "icon@3x.png": readFileSync(path.join(WALLET_IMAGE_DIR, "icon@3x.png")),
      "logo.png": readFileSync(path.join(WALLET_IMAGE_DIR, "logo.png")),
      "logo@2x.png": readFileSync(path.join(WALLET_IMAGE_DIR, "logo@2x.png")),
    },
    {
      wwdr: readFileSync(WWDR_CERT_PATH),
      signerCert: Buffer.from(process.env.APPLE_PASS_SIGNER_CERT_BASE64!, "base64"),
      signerKey: Buffer.from(process.env.APPLE_PASS_SIGNER_KEY_BASE64!, "base64"),
      signerKeyPassphrase: process.env.APPLE_PASS_SIGNER_KEY_PASSPHRASE,
    },
    {
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER!,
      teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER!,
      serialNumber: input.cardId,
      description: `${input.shopName} loyalty card`,
      organizationName: input.shopName,
      backgroundColor: "rgb(10, 10, 10)",
      foregroundColor: "rgb(255, 250, 240)",
    },
  );

  // Setting .type resets all field arrays, so it must happen before pushing
  // any fields below.
  pass.type = "storeCard";
  pass.headerFields.push({ key: "shop", label: "", value: input.shopName });
  pass.primaryFields.push({
    key: "stamps",
    label: "STAMPS",
    value: `${input.stampsEarned} / ${input.stampsRequired}`,
  });
  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: input.cardId,
    messageEncoding: "iso-8859-1",
  });

  return pass.getAsBuffer();
}

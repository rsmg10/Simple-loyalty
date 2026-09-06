// One-off provisioning step — run once after setting the Google Wallet env
// vars, to create (or update) this shop's Loyalty Class. Not part of the
// app's request path; nothing else ever creates or edits the class.
//
// Usage (Node 20+, loads vars from .env.local without adding a dependency):
//   node --env-file=.env.local scripts/setup-google-wallet-class.mjs "Cafe Meridian"
import { JWT } from "google-auth-library";

const WALLET_API_BASE = "https://walletobjects.googleapis.com/walletobjects/v1";
const WALLET_SCOPE = "https://www.googleapis.com/auth/wallet_object.issuer";

const shopName = process.argv[2] ?? "Loyalty Card";

const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
const rawKey = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY;

if (!issuerId || !serviceAccountEmail || !rawKey) {
  console.error(
    "Missing GOOGLE_WALLET_ISSUER_ID / GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL / GOOGLE_WALLET_SERVICE_ACCOUNT_KEY.",
  );
  process.exit(1);
}

const privateKey = rawKey.replace(/\\n/g, "\n");

// Keep in sync with googleWalletClassId() in src/lib/google-wallet.ts.
const classId = `${issuerId}.loyalty_class`;

const loyaltyClass = {
  id: classId,
  issuerName: shopName,
  programName: `${shopName} Loyalty Card`,
  reviewStatus: "UNDER_REVIEW",
  hexBackgroundColor: "#0a0a0a",
  programLogo: {
    sourceUri: { uri: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/wallet/google-logo.png` },
  },
};

const client = new JWT({ email: serviceAccountEmail, key: privateKey, scopes: [WALLET_SCOPE] });

async function main() {
  try {
    await client.request({
      url: `${WALLET_API_BASE}/loyaltyClass/${classId}`,
      method: "PATCH",
      data: loyaltyClass,
    });
    console.log(`Updated existing Loyalty Class ${classId}`);
  } catch (error) {
    if (error?.response?.status !== 404) throw error;
    await client.request({ url: `${WALLET_API_BASE}/loyaltyClass`, method: "POST", data: loyaltyClass });
    console.log(`Created new Loyalty Class ${classId}`);
  }
  console.log(
    "Note: new classes start 'UNDER_REVIEW' — Google must approve it before passes are " +
      "visible outside your own test Google account. See " +
      "https://developers.google.com/wallet/generic/gs-getting-started",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

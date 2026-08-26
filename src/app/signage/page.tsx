"use client";

import CardQRCode from "@/components/CardQRCode";
import { useShopConfig } from "@/lib/shop-config";

// Publicly accessible on purpose — no staff PIN gate. This page is meant to
// be pulled up once on any device and printed or displayed permanently at
// the counter, so a brand-new customer who has never visited the site can
// scan their way in.
export default function SignagePage() {
  const { shopName, stampsRequired, loading } = useShopConfig();
  // Same pattern as the unsubscribe link in src/lib/email.ts: a missing
  // NEXT_PUBLIC_APP_URL is an explicit misconfiguration, surfaced as-is
  // rather than silently substituted with window.location.origin (which
  // could print a preview-deploy URL or bare IP on a permanent sign).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-lg py-xxl print:p-0">
      <div className="w-full max-w-md rounded-lg border border-hairline bg-canvas p-xl text-center print:border-0">
        <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
          {loading ? "Loading…" : shopName || "Loyalty Card"}
        </p>
        <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
          Scan to start collecting stamps
        </h1>

        <div className="mt-lg flex justify-center">
          {appUrl ? (
            <CardQRCode value={appUrl} size={320} label="Scan to join the loyalty card" />
          ) : (
            <p className="text-body-sm text-muted">
              NEXT_PUBLIC_APP_URL is not configured — set it to generate this
              QR code.
            </p>
          )}
        </div>

        <p className="mt-lg text-body-md text-ink">
          Free coffee after {stampsRequired} stamps
        </p>
      </div>
    </main>
  );
}

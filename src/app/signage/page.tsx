"use client";

import CardQRCode from "@/components/CardQRCode";
import { useI18n } from "@/components/I18nProvider";
import LanguageToggle from "@/components/LanguageToggle";
import { useShopConfig } from "@/lib/shop-config";

// Publicly accessible on purpose — no staff PIN gate. This page is meant to
// be pulled up once on any device and printed or displayed permanently at
// the counter, so a brand-new customer who has never visited the site can
// scan their way in.
export default function SignagePage() {
  const { t } = useI18n();
  const { shopName, stampsRequired, loading } = useShopConfig();
  // Same pattern as the unsubscribe link in src/lib/email.ts: a missing
  // NEXT_PUBLIC_APP_URL is an explicit misconfiguration, surfaced as-is
  // rather than silently substituted with window.location.origin (which
  // could print a preview-deploy URL or bare IP on a permanent sign).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-md bg-canvas p-lg py-xxl print:p-0">
      <div className="w-full max-w-md rounded-lg border border-hairline bg-canvas p-xl text-center print:border-0">
        <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
          {loading ? t.signage.loading : shopName || t.signage.fallbackName}
        </p>
        <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
          {t.signage.title}
        </h1>

        <div className="mt-lg flex justify-center">
          {appUrl ? (
            <CardQRCode value={appUrl} size={320} label={t.signage.qrLabel} />
          ) : (
            <p className="text-body-sm text-muted">{t.signage.notConfigured}</p>
          )}
        </div>

        <p className="mt-lg text-body-md text-ink">
          {t.signage.reward(stampsRequired)}
        </p>
      </div>
      <LanguageToggle />
    </main>
  );
}

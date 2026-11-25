"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import LanguageToggle from "@/components/LanguageToggle";
import { useShopConfig } from "@/lib/shop-config";

// Plain-language note for customers, linked from the card. It describes
// what the app actually does — keep it in step when data handling changes.
export default function PrivacyPage() {
  const { t } = useI18n();
  const { shopName } = useShopConfig();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-md bg-canvas p-lg py-xxl">
      <article className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-xl">
        <h1 className="text-display-sm font-medium tracking-display-sm text-ink">{t.privacy.title}</h1>
        {shopName && <p className="mt-xs text-body-md text-body">{t.privacy.intro(shopName)}</p>}
        {t.privacy.sections.map((section) => (
          <section key={section.heading} className="mt-lg">
            <h2 className="text-title-sm font-semibold text-ink">{section.heading}</h2>
            <p className="mt-xxs text-body-sm text-muted">{section.body}</p>
          </section>
        ))}
        <Link
          href="/"
          className="mt-xl flex h-11 w-full items-center justify-center rounded-md bg-primary text-button font-semibold text-on-primary"
        >
          {t.privacy.back}
        </Link>
      </article>
      <LanguageToggle />
    </main>
  );
}

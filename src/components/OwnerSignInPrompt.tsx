"use client";

import Link from "next/link";
import { useI18n } from "./I18nProvider";

export default function OwnerSignInPrompt() {
  const { t } = useI18n();
  return (
    <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-xl text-center">
      <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
        {t.owner.accessEyebrow}
      </p>
      <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
        {t.owner.signInTitle}
      </h1>
      <Link
        href="/owner/login"
        className="mt-lg flex h-11 w-full items-center justify-center rounded-md bg-primary text-button font-semibold text-on-primary"
      >
        {t.owner.signIn}
      </Link>
    </div>
  );
}

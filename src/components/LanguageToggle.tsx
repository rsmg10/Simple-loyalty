"use client";

import { useI18n } from "./I18nProvider";

export default function LanguageToggle() {
  const { locale, t, setLocale } = useI18n();
  const other = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      lang={other}
      onClick={() => setLocale(other)}
      className="text-body-sm text-muted underline underline-offset-2 print:hidden"
    >
      {t.common.switchLanguage}
    </button>
  );
}

import type { Locale } from "./i18n/locale";

// Latin digits in Arabic too — that's what Libyan phones show by default.
export function formatDate(iso: string, locale: Locale, withTime = false): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-LY-u-nu-latn" : "en", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(new Date(iso));
}

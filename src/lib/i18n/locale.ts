// Dependency-free so it can be shared by the server layout, the client
// provider, and tests.

export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

// A viewer's explicit choice (the cookie) wins; otherwise the deployment's
// DEFAULT_LOCALE; otherwise English, which keeps existing deployments
// exactly as they were.
export function resolveLocale(cookieValue: string | undefined, defaultLocale: string | undefined): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  if (isLocale(defaultLocale)) return defaultLocale;
  return "en";
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

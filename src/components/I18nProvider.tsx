"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { messages, type Messages } from "@/lib/i18n/messages";
import { LOCALE_COOKIE, dirFor, type Locale } from "@/lib/i18n/locale";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

type I18nContextValue = {
  locale: Locale;
  t: Messages;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

// The root layout resolves the locale server-side (cookie, then
// DEFAULT_LOCALE) and sets <html lang dir> for the first paint; switching
// here updates the same cookie so the next server render agrees, and flips
// the <html> attributes in place so there's no reload.
export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    document.documentElement.lang = next;
    document.documentElement.dir = dirFor(next);
  }, []);

  const value = useMemo(() => ({ locale, t: messages[locale], setLocale }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}

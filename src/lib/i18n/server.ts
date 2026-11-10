import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, type Locale } from "./locale";

export function getRequestLocale(): Locale {
  return resolveLocale(cookies().get(LOCALE_COOKIE)?.value, process.env.DEFAULT_LOCALE);
}

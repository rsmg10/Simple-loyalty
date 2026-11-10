import type { Locale } from "./i18n/locale";
import { messages } from "./i18n/messages";

export function getEncouragementCopy(stampsEarned: number, stampsRequired: number, locale: Locale = "en"): string {
  // A card is reset to 0 the moment it's completed (see the stamp route
  // handler at src/app/api/cards/[id]/stamp/route.ts), so `remaining === 0`
  // can never actually be observed here — the "just redeemed" celebration
  // banner is what communicates completion instead.
  const remaining = Math.max(stampsRequired - stampsEarned, 0);
  const copy = messages[locale].encouragement;

  if (remaining === 1) {
    return copy.oneLeft;
  }
  if (stampsEarned === 0) {
    return copy.start(remaining);
  }
  if (stampsEarned / stampsRequired >= 0.5) {
    return copy.halfway(remaining);
  }
  return copy.more(remaining);
}

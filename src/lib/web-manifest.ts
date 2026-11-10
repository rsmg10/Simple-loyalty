import type { MetadataRoute } from "next";
import { dirFor, type Locale } from "./i18n/locale";

const CARD_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The card page points its manifest link at `?card=<its id>`, so a
// home-screen icon launches *that* card: on iOS an installed web app gets
// its own storage, separate from Safari, and would otherwise open as a
// brand-new empty card. The page adopts the id from the start URL (see
// useOwnCard), the same way it does for a card staff move to a new phone.
export function buildWebManifest(options: {
  shopName: string;
  locale: Locale;
  cardId: string | null;
}): MetadataRoute.Manifest {
  const { shopName, locale, cardId } = options;
  const validCardId = cardId && CARD_ID_PATTERN.test(cardId) ? cardId : null;

  return {
    // Fixed id so the start URL can carry the card without making each
    // card a different "app" in the browser's eyes.
    id: "/",
    name: shopName,
    short_name: shopName,
    lang: locale,
    dir: dirFor(locale),
    start_url: validCardId ? `/?card=${validCardId}` : "/",
    scope: "/",
    display: "standalone",
    background_color: "#fffaf0",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

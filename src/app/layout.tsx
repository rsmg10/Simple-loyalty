import type { Metadata, Viewport } from "next";
import { I18nProvider } from "@/components/I18nProvider";
import { dirFor } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";
import { getShop } from "@/lib/shop-repo";
import "./globals.css";

// generateMetadata() needs a live DB read for the shop name — force every
// page to render at request time instead of build time, or `next build`
// fails without a reachable Supabase connection (and a static build would
// never reflect a shop-name change made after deploy anyway).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const shop = await getShop();
  const { meta } = messages[getRequestLocale()];

  return {
    title: `${shop.name} — ${meta.titleSuffix}`,
    description: meta.description,
    // No `manifest` here on purpose: the card page adds its own,
    // card-specific one (see HomeScreenPrompt), and staff/setup pages are
    // better saved as plain shortcuts to themselves.
    icons: {
      icon: "/icon.svg",
      apple: "/apple-touch-icon.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: shop.name,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getRequestLocale();

  return (
    <html lang={locale} dir={dirFor(locale)}>
      <body className="bg-canvas font-sans text-body antialiased">
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}

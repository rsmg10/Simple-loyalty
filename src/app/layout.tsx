import type { Metadata, Viewport } from "next";
import { getShop } from "@/lib/shop-repo";
import "./globals.css";

// generateMetadata() needs a live DB read for the shop name — force every
// page to render at request time instead of build time, or `next build`
// fails without a reachable Supabase connection (and a static build would
// never reflect a shop-name change made after deploy anyway).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const shop = await getShop();

  return {
    title: `${shop.name} — Loyalty Card`,
    description: "Your digital stamp card",
    icons: {
      icon: "/icon.svg",
      apple: "/icon.svg",
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
  return (
    <html lang="en">
      <body className="bg-canvas font-sans text-body antialiased">
        {children}
      </body>
    </html>
  );
}

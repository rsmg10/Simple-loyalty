import type { Metadata, Viewport } from "next";
import { getShop } from "@/lib/shop-repo";
import "./globals.css";

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

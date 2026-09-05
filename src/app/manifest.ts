import type { MetadataRoute } from "next";
import { getShop } from "@/lib/shop-repo";

// Same reasoning as the root layout's generateMetadata — this needs a live
// DB read, so it must never be attempted at build time.
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const shop = await getShop();

  return {
    name: `${shop.name} Loyalty Card`,
    short_name: shop.name,
    description: `Digital stamp card for ${shop.name}`,
    start_url: "/",
    display: "standalone",
    background_color: "#fffaf0",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

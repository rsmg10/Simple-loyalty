// Pure hostname → shop-slug resolution, kept separate from middleware.ts so
// it's testable without any Next.js request machinery. See the "three
// resolution states" note in shop-repo.ts's getShop() — this function only
// ever returns a slug or null; it never decides what null *means* (that's
// getShop()'s job, since it depends on whether APP_ROOT_DOMAIN is set at all).
export function resolveShopSlug(host: string, rootDomain: string | undefined): string | null {
  if (!rootDomain) return null;

  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const root = rootDomain.toLowerCase();

  if (hostname === root || hostname === `www.${root}`) return null;
  if (!hostname.endsWith(`.${root}`)) return null;

  const label = hostname.slice(0, -(root.length + 1));
  // Reject multi-level subdomains (e.g. "a.b.yourapp.com") rather than
  // guessing which label is the slug — safer to not resolve than to
  // resolve to an unintended shop.
  if (!label || label.includes(".")) return null;

  return label;
}

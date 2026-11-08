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

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
// "www" is rejected because resolveShopSlug() above treats www.<root> as no
// tenant — a shop claiming it could never actually be reached.
const RESERVED_SLUGS = new Set(["www"]);

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug);
}

// Best-effort suggestion for a signup form's slug field, not a validator —
// isValidSlug() is the actual gate. The caller should still let the owner
// edit the result.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
    .replace(/-+$/, "");
}

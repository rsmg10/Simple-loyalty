import { headers } from "next/headers";
import { getSupabaseAdmin } from "./supabase";

const SHOP_SLUG_HEADER = "x-shop-slug";
const SHOP_COLUMNS =
  "id, name, stamps_required, staff_pin_hash, failed_pin_attempts, pin_locked_until, owner_user_id";

export type Shop = {
  id: string;
  name: string;
  stampsRequired: number;
  staffPinHash: string;
  failedPinAttempts: number;
  pinLockedUntil: string | null;
  ownerUserId: string | null;
};

const MAX_FAILED_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 5 * 60 * 1000;

// Reads the shop the current request resolved to. middleware.ts sets the
// x-shop-slug header for a request to a known subdomain — when present,
// look that shop up by slug. Otherwise there are two distinct cases (see
// the plan doc for the full reasoning):
//  - APP_ROOT_DOMAIN unset: this is a single-café (Model A) deployment that
//    never had subdomain routing set up at all. Read the one seeded shop
//    row, exactly as this always has. Zero behavior change.
//  - APP_ROOT_DOMAIN set: this is a multi-tenant deployment, and the
//    request didn't resolve to a specific shop (e.g. the bare root/
//    marketing domain). Never fall back to "the first shop" here — that
//    would leak an arbitrary tenant's data onto an unauthenticated page.
export async function getShop(): Promise<Shop> {
  const slug = headers().get(SHOP_SLUG_HEADER);
  const supabase = getSupabaseAdmin();

  let query = supabase.from("shops").select(SHOP_COLUMNS);
  if (slug) {
    query = query.eq("slug", slug);
  } else if (process.env.APP_ROOT_DOMAIN) {
    throw new Error("No shop resolved for this request");
  } else {
    query = query.limit(1);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    throw new Error(`Failed to load shop: ${error?.message ?? "no shop row found"}`);
  }

  return {
    id: data.id,
    name: data.name,
    stampsRequired: data.stamps_required,
    staffPinHash: data.staff_pin_hash,
    failedPinAttempts: data.failed_pin_attempts,
    pinLockedUntil: data.pin_locked_until,
    ownerUserId: data.owner_user_id,
  };
}

export function isPinLocked(shop: Shop): boolean {
  return !!shop.pinLockedUntil && new Date(shop.pinLockedUntil).getTime() > Date.now();
}

export async function recordFailedPinAttempt(shop: Shop): Promise<void> {
  const attempts = shop.failedPinAttempts + 1;
  const update: { failed_pin_attempts: number; pin_locked_until?: string } = {
    failed_pin_attempts: attempts,
  };
  if (attempts >= MAX_FAILED_PIN_ATTEMPTS) {
    update.pin_locked_until = new Date(Date.now() + PIN_LOCKOUT_MS).toISOString();
  }

  const supabase = getSupabaseAdmin();
  await supabase.from("shops").update(update).eq("id", shop.id);
}

export async function resetPinAttempts(shop: Shop): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase
    .from("shops")
    .update({ failed_pin_attempts: 0, pin_locked_until: null })
    .eq("id", shop.id);
}

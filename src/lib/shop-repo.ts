import { headers } from "next/headers";
import { SHOP_LIMITS, afterFailure, isLocked, type AttemptState } from "./login-throttle";
import { getSupabaseAdmin } from "./supabase";

const SHOP_SLUG_HEADER = "x-shop-slug";
// Not logo_data_url: that's the image itself, only read by /api/shop/logo.
const SHOP_COLUMNS =
  "id, name, stamps_required, staff_pin_hash, failed_pin_attempts, pin_locked_until, owner_user_id, slug, reward_name, brand_color, logo_updated_at, welcome_bonus, double_stamp_weekdays, timezone, group_id";

export type Shop = {
  id: string;
  name: string;
  stampsRequired: number;
  staffPinHash: string;
  failedPinAttempts: number;
  pinLockedUntil: string | null;
  ownerUserId: string | null;
  slug: string | null;
  rewardName: string | null;
  brandColor: string | null;
  logoUpdatedAt: string | null;
  welcomeBonus: number;
  doubleStampWeekdays: number[];
  timezone: string;
  groupId: string | null;
};

function toShop(data: {
  id: string;
  name: string;
  stamps_required: number;
  staff_pin_hash: string;
  failed_pin_attempts: number;
  pin_locked_until: string | null;
  owner_user_id: string | null;
  slug: string | null;
  reward_name: string | null;
  brand_color: string | null;
  logo_updated_at: string | null;
  welcome_bonus: number;
  double_stamp_weekdays: number[];
  timezone: string;
  group_id: string | null;
}): Shop {
  return {
    id: data.id,
    name: data.name,
    stampsRequired: data.stamps_required,
    staffPinHash: data.staff_pin_hash,
    failedPinAttempts: data.failed_pin_attempts,
    pinLockedUntil: data.pin_locked_until,
    ownerUserId: data.owner_user_id,
    slug: data.slug,
    rewardName: data.reward_name,
    brandColor: data.brand_color,
    logoUpdatedAt: data.logo_updated_at,
    welcomeBonus: data.welcome_bonus,
    doubleStampWeekdays: data.double_stamp_weekdays,
    timezone: data.timezone,
    groupId: data.group_id,
  };
}


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
    // Single-café deployments have one shop; ordering keeps it the same
    // one even if a second row ever appears (e.g. inserted by hand).
    query = query.order("created_at").limit(1);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    throw new Error(`Failed to load shop: ${error?.message ?? "no shop row found"}`);
  }

  return toShop(data);
}

// Used by /owner/onboarding to check whether a signed-in owner already has
// a shop — a missing row is an expected outcome here (a brand-new owner
// account), not an error, unlike getShop().
export async function getShopByOwnerUserId(ownerUserId: string): Promise<Shop | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shops")
    .select(SHOP_COLUMNS)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();

  if (error || !data) return null;
  return toShop(data);
}

// The shop-wide backstop (see login-throttle.ts); per-client limits live in
// login-attempts-repo.ts.
function shopAttemptState(shop: Shop): AttemptState {
  return { failedAttempts: shop.failedPinAttempts, lockedUntil: shop.pinLockedUntil };
}

export function isPinLocked(shop: Shop): boolean {
  return isLocked(shopAttemptState(shop));
}

export async function recordFailedPinAttempt(shop: Shop): Promise<void> {
  const next = afterFailure(shopAttemptState(shop), SHOP_LIMITS);
  const supabase = getSupabaseAdmin();
  await supabase
    .from("shops")
    .update({ failed_pin_attempts: next.failedAttempts, pin_locked_until: next.lockedUntil })
    .eq("id", shop.id);
}

export async function resetPinAttempts(shop: Shop): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase
    .from("shops")
    .update({ failed_pin_attempts: 0, pin_locked_until: null })
    .eq("id", shop.id);
}

// This shop and every branch in its group — where a card may be looked up
// and used (see card_belongs_to_shop in migration 0005).
export async function getGroupShopIds(shop: Shop): Promise<string[]> {
  if (!shop.groupId) return [shop.id];
  const { data } = await getSupabaseAdmin().from("shops").select("id").eq("group_id", shop.groupId);
  return data?.map((row) => row.id) ?? [shop.id];
}

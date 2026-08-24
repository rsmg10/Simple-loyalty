import { getSupabaseAdmin } from "./supabase";

export type Shop = {
  id: string;
  name: string;
  stampsRequired: number;
  staffPin: string;
  failedPinAttempts: number;
  pinLockedUntil: string | null;
};

const MAX_FAILED_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 5 * 60 * 1000;

// MVP operates a single shop — this reads the one seeded row. A multi-tenant
// version would look this up by slug/subdomain instead.
export async function getShop(): Promise<Shop> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shops")
    .select("id, name, stamps_required, staff_pin, failed_pin_attempts, pin_locked_until")
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(`Failed to load shop: ${error?.message ?? "no shop row found"}`);
  }

  return {
    id: data.id,
    name: data.name,
    stampsRequired: data.stamps_required,
    staffPin: data.staff_pin,
    failedPinAttempts: data.failed_pin_attempts,
    pinLockedUntil: data.pin_locked_until,
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

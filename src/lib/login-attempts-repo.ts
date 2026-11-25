import type { AttemptState } from "./login-throttle";
import { NO_ATTEMPTS } from "./login-throttle";
import { getSupabaseAdmin } from "./supabase";

export async function getLoginAttempts(shopId: string, clientKey: string): Promise<AttemptState> {
  const { data } = await getSupabaseAdmin()
    .from("staff_login_attempts")
    .select("failed_attempts, locked_until")
    .eq("shop_id", shopId)
    .eq("client_key", clientKey)
    .maybeSingle();
  return data ? { failedAttempts: data.failed_attempts, lockedUntil: data.locked_until } : NO_ATTEMPTS;
}

export async function saveLoginAttempts(shopId: string, clientKey: string, state: AttemptState): Promise<void> {
  await getSupabaseAdmin().from("staff_login_attempts").upsert({
    shop_id: shopId,
    client_key: clientKey,
    failed_attempts: state.failedAttempts,
    locked_until: state.lockedUntil,
    updated_at: new Date().toISOString(),
  });
}

export async function clearLoginAttempts(shopId: string, clientKey: string): Promise<void> {
  await getSupabaseAdmin().from("staff_login_attempts").delete().eq("shop_id", shopId).eq("client_key", clientKey);
}

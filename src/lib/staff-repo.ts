import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "./supabase";

export type StaffMember = { id: string; name: string; active: boolean; createdAt: string };

export async function listStaff(shopId: string): Promise<StaffMember[]> {
  const { data } = await getSupabaseAdmin()
    .from("staff_members")
    .select("id, name, active, created_at")
    .eq("shop_id", shopId)
    .order("created_at");
  return (data ?? []).map((row) => ({ id: row.id, name: row.name, active: row.active, createdAt: row.created_at }));
}

async function activePinHashes(shopId: string): Promise<{ id: string; pin_hash: string }[]> {
  const { data } = await getSupabaseAdmin()
    .from("staff_members")
    .select("id, pin_hash")
    .eq("shop_id", shopId)
    .eq("active", true);
  return data ?? [];
}

// Which active staff member this PIN belongs to, if any. PINs are unique
// within a shop (enforced in createStaff), so at most one matches.
export async function findStaffByPin(shopId: string, pin: string): Promise<string | null> {
  for (const member of await activePinHashes(shopId)) {
    if (await bcrypt.compare(pin, member.pin_hash)) return member.id;
  }
  return null;
}

export async function isPinTaken(shopId: string, managerPinHash: string, pin: string): Promise<boolean> {
  if (await bcrypt.compare(pin, managerPinHash)) return true;
  return (await findStaffByPin(shopId, pin)) !== null;
}

export async function createStaff(shopId: string, name: string, pin: string): Promise<StaffMember | null> {
  const { data } = await getSupabaseAdmin()
    .from("staff_members")
    .insert({ shop_id: shopId, name, pin_hash: await bcrypt.hash(pin, 10) })
    .select("id, name, active, created_at")
    .single();
  return data ? { id: data.id, name: data.name, active: data.active, createdAt: data.created_at } : null;
}

export async function setStaffActive(shopId: string, staffId: string, active: boolean): Promise<boolean> {
  const { data } = await getSupabaseAdmin()
    .from("staff_members")
    .update({ active })
    .eq("id", staffId)
    .eq("shop_id", shopId)
    .select("id");
  return (data?.length ?? 0) > 0;
}

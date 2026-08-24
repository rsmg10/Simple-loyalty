import { getSupabaseAdmin } from "./supabase";

export type Shop = {
  id: string;
  name: string;
  stampsRequired: number;
  staffPin: string;
};

// MVP operates a single shop — this reads the one seeded row. A multi-tenant
// version would look this up by slug/subdomain instead.
export async function getShop(): Promise<Shop> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shops")
    .select("id, name, stamps_required, staff_pin")
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
  };
}

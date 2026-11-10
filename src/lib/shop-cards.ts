import { getSupabaseAdmin } from "./supabase";

// Supabase caps a single select at 1,000 rows by default, so reading every
// card of a busy café in one request silently truncates. Page through
// instead, ordered by id so pages don't overlap.
const PAGE_SIZE = 1000;

export async function selectAllShopCards<T>(
  shopId: string,
  columns: string,
  options: { withPhoneOnly?: boolean } = {},
): Promise<T[] | null> {
  const supabase = getSupabaseAdmin();
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase.from("cards").select(columns).eq("shop_id", shopId);
    if (options.withPhoneOnly) query = query.not("phone", "is", null);
    const { data, error } = await query.order("id").range(from, from + PAGE_SIZE - 1);

    if (error || !data) return null;
    rows.push(...(data as unknown as T[]));
    if (data.length < PAGE_SIZE) return rows;
  }
}

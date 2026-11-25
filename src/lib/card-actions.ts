import { toCardJson, type CardJson, type CardRow } from "./card-json";
import { getSupabaseAdmin } from "./supabase";

// Thin wrappers over the database functions in migration 0005. Every card
// change happens inside one of them: atomic under concurrent staff, scoped
// to cards usable at this shop (its own or its branch group's), and logged
// in stamp_events.

// How long staff can undo a stamp or reward handover from the counter.
export const UNDO_WINDOW_MINUTES = 10;

type RpcResult = { event_id?: string; bonus?: number; card?: CardRow; error?: string } | null;

async function call(fn: string, args: Record<string, unknown>): Promise<RpcResult> {
  const { data, error } = await getSupabaseAdmin().rpc(fn, args);
  if (error) throw new Error(`${fn} failed: ${error.message}`);
  return data as RpcResult;
}

export type CardActionResult =
  | { ok: true; card: CardJson; eventId: string | null; bonus: number }
  | { ok: false; error: "not_found" | string };

function toResult(result: RpcResult): CardActionResult {
  if (!result) return { ok: false, error: "not_found" };
  if (result.error || !result.card) return { ok: false, error: result.error ?? "not_found" };
  return { ok: true, card: toCardJson(result.card), eventId: result.event_id ?? null, bonus: result.bonus ?? 0 };
}

export async function stampCard(cardId: string, shopId: string, count: number, staffMemberId: string | null) {
  return toResult(
    await call("stamp_card", { p_card_id: cardId, p_shop_id: shopId, p_count: count, p_staff_member_id: staffMemberId }),
  );
}

export async function redeemReward(cardId: string, shopId: string, staffMemberId: string | null) {
  return toResult(await call("redeem_reward", { p_card_id: cardId, p_shop_id: shopId, p_staff_member_id: staffMemberId }));
}

export async function adjustCardStamps(cardId: string, shopId: string, stampsEarned: number) {
  return toResult(await call("adjust_card_stamps", { p_card_id: cardId, p_shop_id: shopId, p_stamps_earned: stampsEarned }));
}

export async function undoEvent(eventId: string, shopId: string, windowMinutes: number) {
  return toResult(await call("undo_event", { p_event_id: eventId, p_shop_id: shopId, p_window_minutes: windowMinutes }));
}

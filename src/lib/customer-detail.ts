import { ACTIVITY_COLUMNS, toActivityJson, type ActivityJson, type ActivityRow } from "./activity";
import { toCardJson, type CardJson, type CardRow } from "./card-json";

export type CustomerDetailJson = CardJson & {
  // The manager may see the full number — they can already message it from
  // the customer list.
  phone: string | null;
  visits: number;
  lifetimeStamps: number;
  lastStampedAt: string | null;
  createdAt: string;
  history: ActivityJson[];
};

export function toCustomerDetail(row: CardRow & { created_at: string }, history: ActivityRow[]): CustomerDetailJson {
  return {
    ...toCardJson(row),
    phone: row.phone ?? null,
    visits: row.visits ?? 0,
    lifetimeStamps: row.lifetime_stamps ?? 0,
    lastStampedAt: row.last_stamped_at ?? null,
    createdAt: row.created_at,
    history: history.map(toActivityJson),
  };
}

export const HISTORY_COLUMNS = ACTIVITY_COLUMNS;
export const HISTORY_LIMIT = 20;

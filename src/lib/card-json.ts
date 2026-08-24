export type CardRow = {
  id: string;
  shop_id: string;
  stamps_earned: number;
  stamps_required: number;
  redemptions: number;
  last_seen_redemptions: number;
  email: string | null;
};

export type CardJson = {
  id: string;
  stampsEarned: number;
  stampsRequired: number;
  redemptions: number;
  lastSeenRedemptions: number;
  email?: string;
};

export function toCardJson(row: CardRow): CardJson {
  return {
    id: row.id,
    stampsEarned: row.stamps_earned,
    stampsRequired: row.stamps_required,
    redemptions: row.redemptions,
    lastSeenRedemptions: row.last_seen_redemptions,
    email: row.email ?? undefined,
  };
}

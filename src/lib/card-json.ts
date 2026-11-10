import { maskPhone } from "./phone";

export type CardRow = {
  id: string;
  shop_id: string;
  stamps_earned: number;
  stamps_required: number;
  redemptions: number;
  last_seen_redemptions: number;
  email: string | null;
  phone?: string | null;
};

export type CardJson = {
  id: string;
  stampsEarned: number;
  stampsRequired: number;
  redemptions: number;
  lastSeenRedemptions: number;
  email?: string;
  // Masked — the card id is the only credential a card has, so the full
  // number never goes back out to whoever holds it.
  phoneHint?: string;
};

export function toCardJson(row: CardRow): CardJson {
  return {
    id: row.id,
    stampsEarned: row.stamps_earned,
    stampsRequired: row.stamps_required,
    redemptions: row.redemptions,
    lastSeenRedemptions: row.last_seen_redemptions,
    email: row.email ?? undefined,
    phoneHint: row.phone ? maskPhone(row.phone) : undefined,
  };
}

// A card rolls over to a redemption the moment it hits its stamp
// threshold — earning the final stamp *is* the redemption, staff hand over
// the free item in the same interaction.
export function applyStamp(card: {
  stamps_earned: number;
  stamps_required: number;
  redemptions: number;
}): { stamps_earned: number; redemptions: number } {
  let stampsEarned = card.stamps_earned + 1;
  let redemptions = card.redemptions;

  if (stampsEarned >= card.stamps_required) {
    stampsEarned = 0;
    redemptions += 1;
  }

  return { stamps_earned: stampsEarned, redemptions };
}

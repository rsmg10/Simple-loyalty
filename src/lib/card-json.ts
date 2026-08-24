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

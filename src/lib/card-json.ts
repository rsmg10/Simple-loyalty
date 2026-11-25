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
  rewards_used?: number;
  visits?: number;
  lifetime_stamps?: number;
  last_stamped_at?: string | null;
};

export type CardJson = {
  id: string;
  stampsEarned: number;
  stampsRequired: number;
  redemptions: number;
  // Earned but not yet handed over — saved for a later visit.
  rewardsAvailable: number;
  lastSeenRedemptions: number;
  // Both masked — the card id is the only credential a card has (it's in
  // the QR code anyone at the counter can photograph), so the full email or
  // number never goes back out to whoever holds it.
  emailHint?: string;
  phoneHint?: string;
};

export function toCardJson(row: CardRow): CardJson {
  return {
    id: row.id,
    stampsEarned: row.stamps_earned,
    stampsRequired: row.stamps_required,
    redemptions: row.redemptions,
    rewardsAvailable: Math.max(0, row.redemptions - (row.rewards_used ?? row.redemptions)),
    lastSeenRedemptions: row.last_seen_redemptions,
    emailHint: row.email ? maskEmail(row.email) : undefined,
    phoneHint: row.phone ? maskPhone(row.phone) : undefined,
  };
}

// "ahmed@gmail.com" → "a•••@gmail.com": recognisable to its owner, useless
// to anyone else.
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return "•••";
  return `${email[0]}•••${email.slice(at)}`;
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

// Upper bound on stamps in one go — a big order, not a typo'd "100".
export const MAX_STAMPS_PER_PURCHASE = 10;

// Several stamps from one purchase, applied one at a time so a purchase that
// crosses the threshold completes the card and carries the rest onto the
// next one (8/9 + 3 stamps = 1 redemption, then 2/9).
export function applyStamps(
  card: { stamps_earned: number; stamps_required: number; redemptions: number },
  count: number,
): { stamps_earned: number; redemptions: number } {
  let result = { stamps_earned: card.stamps_earned, redemptions: card.redemptions };
  for (let i = 0; i < count; i++) {
    result = applyStamp({ ...result, stamps_required: card.stamps_required });
  }
  return result;
}

// Who's worth a WhatsApp message today: customers one stamp from a reward,
// and regulars who've stopped coming. Only customers who added a phone
// number (and were told the café may message them) can appear.

export const LAPSED_AFTER_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ReminderRow = {
  phone: string;
  stamps_earned: number;
  stamps_required: number;
  redemptions: number;
  rewards_used: number;
  visits: number;
  last_stamped_at: string | null;
};

export type ReminderCustomer = { phone: string; stampsEarned: number; stampsRequired: number; lastStampedAt: string | null };

export function reminderLists(rows: ReminderRow[], now: Date = new Date()) {
  const lapsedBefore = now.getTime() - LAPSED_AFTER_DAYS * DAY_MS;
  const toCustomer = (row: ReminderRow): ReminderCustomer => ({
    phone: row.phone,
    stampsEarned: row.stamps_earned,
    stampsRequired: row.stamps_required,
    lastStampedAt: row.last_stamped_at,
  });

  return {
    oneAway: rows.filter((row) => row.stamps_earned === row.stamps_required - 1).map(toCustomer),
    rewardWaiting: rows.filter((row) => row.redemptions - row.rewards_used > 0).map(toCustomer),
    // Came at least twice (a regular, not a one-off) and not in a month.
    lapsed: rows
      .filter((row) => row.visits >= 2 && row.last_stamped_at && new Date(row.last_stamped_at).getTime() < lapsedBefore)
      .map(toCustomer),
  };
}

export const ACTIVE_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type StatsRow = {
  visits: number;
  lifetime_stamps: number;
  redemptions: number;
  last_stamped_at: string | null;
};

export type ShopStatsJson = {
  totalCards: number;
  totalStampsGiven: number;
  totalRedemptions: number;
  // Cards with at least one stamp — a card that was opened but never
  // stamped is someone who scanned the sign, not a customer yet.
  stampedCustomers: number;
  // Stamped on 2+ separate occasions (one visit per scan, however many
  // stamps). Cards from before visits were tracked count one per stamp.
  returningCustomers: number;
  activeCustomers: number;
};

export function computeShopStats(rows: StatsRow[], now: Date = new Date()): ShopStatsJson {
  const activeSince = now.getTime() - ACTIVE_WINDOW_DAYS * DAY_MS;
  let totalStampsGiven = 0;
  let totalRedemptions = 0;
  let stampedCustomers = 0;
  let returningCustomers = 0;
  let activeCustomers = 0;

  for (const row of rows) {
    totalStampsGiven += row.lifetime_stamps;
    totalRedemptions += row.redemptions;
    if (row.lifetime_stamps >= 1) stampedCustomers += 1;
    if (row.visits >= 2) returningCustomers += 1;
    if (row.last_stamped_at && new Date(row.last_stamped_at).getTime() >= activeSince) activeCustomers += 1;
  }

  return {
    totalCards: rows.length,
    totalStampsGiven,
    totalRedemptions,
    stampedCustomers,
    returningCustomers,
    activeCustomers,
  };
}

// Whole-number percentage, or null when there's nobody to measure yet.
export function returnRatePercent(stats: Pick<ShopStatsJson, "returningCustomers" | "stampedCustomers">): number | null {
  if (stats.stampedCustomers === 0) return null;
  return Math.round((stats.returningCustomers / stats.stampedCustomers) * 100);
}

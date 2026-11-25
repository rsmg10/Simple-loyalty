// Week-by-week numbers for the owner dashboard, from the stamp log and card
// creation dates. Weeks are rolling 7-day windows ending now ("this week" =
// the last 7 days), which sidesteps which day a week starts on.

export const TREND_WEEKS = 8;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type TrendEventRow = { kind: string; created_at: string; undone_at: string | null; stamps_added: number };
export type TrendWeek = { weeksAgo: number; visits: number; stamps: number; newCustomers: number; rewardsUsed: number };

export function weeklyTrends(
  events: TrendEventRow[],
  newCardDates: string[],
  now: Date = new Date(),
  weeks: number = TREND_WEEKS,
): TrendWeek[] {
  const result: TrendWeek[] = Array.from({ length: weeks }, (_, weeksAgo) => ({
    weeksAgo,
    visits: 0,
    stamps: 0,
    newCustomers: 0,
    rewardsUsed: 0,
  }));
  const bucket = (iso: string) => {
    const age = now.getTime() - new Date(iso).getTime();
    const index = Math.floor(age / WEEK_MS);
    return age >= 0 && index < weeks ? result[index] : null;
  };

  for (const event of events) {
    if (event.undone_at) continue;
    const week = bucket(event.created_at);
    if (!week) continue;
    if (event.kind === "stamp") {
      week.visits += 1;
      week.stamps += event.stamps_added;
    } else if (event.kind === "redeem") {
      week.rewardsUsed += 1;
    }
  }
  for (const created of newCardDates) {
    const week = bucket(created);
    if (week) week.newCustomers += 1;
  }
  // Oldest first, as a chart reads left to right.
  return result.reverse();
}

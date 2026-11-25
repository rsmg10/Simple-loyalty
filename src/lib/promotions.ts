// Mirrors the promotion rules applied inside stamp_card (migration 0005),
// so pages can say "double stamps today" before anyone is stamped.

export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const; // 0 = Sunday, as Postgres' extract(dow)
export const MAX_WELCOME_BONUS = 3;

// The weekday in the shop's own timezone — a café in Tripoli at 1am is
// already on the next day even if the server's clock isn't.
export function weekdayIn(timezone: string, now: Date = new Date()): number {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(now);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

export function isDoubleStampDay(weekdays: number[], timezone: string, now: Date = new Date()): boolean {
  return weekdays.includes(weekdayIn(timezone, now));
}

export function isValidWeekdayList(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length <= 7 &&
    value.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) &&
    new Set(value).size === value.length
  );
}

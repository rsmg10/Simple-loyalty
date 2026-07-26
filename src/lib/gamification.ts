export function getEncouragementCopy(stampsEarned: number, stampsRequired: number): string {
  // A card is reset to 0 the moment it's completed (see addStamp in
  // card-store.ts), so `remaining === 0` can never actually be observed
  // here — the "just redeemed" celebration banner is what communicates
  // completion instead.
  const remaining = Math.max(stampsRequired - stampsEarned, 0);

  if (remaining === 1) {
    return "So close! 1 more stamp and your next coffee is free.";
  }
  if (stampsEarned === 0) {
    return `${remaining} stamps until your next coffee is free.`;
  }
  if (stampsEarned / stampsRequired >= 0.5) {
    return `Halfway there! ${remaining} more stamps until your next coffee is free.`;
  }
  return `${remaining} more stamps until your next coffee is free.`;
}

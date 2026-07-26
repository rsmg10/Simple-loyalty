export function getEncouragementCopy(stampsEarned: number, stampsRequired: number): string {
  const remaining = Math.max(stampsRequired - stampsEarned, 0);

  if (remaining === 0) {
    return "Card complete — your next coffee is on us!";
  }
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

import StampMark from "./StampMark";

type StampGridProps = {
  stampsEarned: number;
  stampsRequired: number;
};

export default function StampGrid({
  stampsEarned,
  stampsRequired,
}: StampGridProps) {
  const stamps = Array.from({ length: stampsRequired }, (_, i) => i < stampsEarned);

  return (
    <div
      className="grid grid-cols-3 gap-sm sm:gap-md"
      role="img"
      aria-label={`${stampsEarned} of ${stampsRequired} stamps earned`}
    >
      {stamps.map((filled, i) => (
        <StampMark key={i} filled={filled} />
      ))}
    </div>
  );
}

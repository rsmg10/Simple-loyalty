import StampMark from "./StampMark";

type StampGridProps = {
  stampsEarned: number;
  stampsRequired: number;
  label: string;
};

export default function StampGrid({
  stampsEarned,
  stampsRequired,
  label,
}: StampGridProps) {
  const stamps = Array.from({ length: stampsRequired }, (_, i) => i < stampsEarned);

  return (
    <div
      className="grid grid-cols-3 gap-sm sm:gap-md"
      role="img"
      aria-label={label}
    >
      {stamps.map((filled, i) => (
        <StampMark key={i} filled={filled} index={i} />
      ))}
    </div>
  );
}

type ProgressBarProps = {
  stampsEarned: number;
  stampsRequired: number;
};

export default function ProgressBar({ stampsEarned, stampsRequired }: ProgressBarProps) {
  const percent = Math.min(100, Math.round((stampsEarned / stampsRequired) * 100));

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-pill bg-surface-strong"
      role="progressbar"
      aria-valuenow={stampsEarned}
      aria-valuemin={0}
      aria-valuemax={stampsRequired}
    >
      <div
        className="h-full rounded-pill bg-primary transition-[width] duration-700 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

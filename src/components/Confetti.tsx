const PARTICLE_COLORS = [
  "#0a0a0a",
  "#e8b94a",
  "#ffb084",
  "#a4d4c5",
  "#b8a4ed",
  "#ff6b5a",
];

const PARTICLE_COUNT = 14;

export default function Confetti() {
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => i);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((i) => {
        const angle = (360 / PARTICLE_COUNT) * i;
        const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-2 w-2 animate-confetti-burst rounded-full"
            style={
              {
                backgroundColor: color,
                "--angle": `${angle}deg`,
                animationDelay: `${(i % 4) * 30}ms`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

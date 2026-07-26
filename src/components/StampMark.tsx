type StampMarkProps = {
  filled: boolean;
};

export default function StampMark({ filled }: StampMarkProps) {
  if (filled) {
    return (
      <div
        className="aspect-square w-full bg-primary"
        style={{ borderRadius: "42% 58% 63% 37% / 41% 44% 56% 59%" }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className="aspect-square w-full rounded-full border-2 border-dashed border-muted-soft"
      aria-hidden="true"
    />
  );
}

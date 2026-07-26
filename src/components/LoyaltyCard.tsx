import CardQRCode from "./CardQRCode";
import StampGrid from "./StampGrid";

type Shop = {
  name: string;
};

type Card = {
  stampsEarned: number;
  stampsRequired: number;
};

type LoyaltyCardProps = {
  shop: Shop;
  card: Card;
  cardId: string;
};

export default function LoyaltyCard({ shop, card, cardId }: LoyaltyCardProps) {
  const { stampsEarned, stampsRequired } = card;
  const stampsRemaining = Math.max(stampsRequired - stampsEarned, 0);
  const isComplete = stampsRemaining === 0;

  return (
    <div className="w-full max-w-sm rounded-xl bg-surface-card p-lg sm:p-xl">
      <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted-soft">
        Digital Stamp Card
      </p>
      <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
        {shop.name}
      </h1>

      <div className="mt-lg">
        <StampGrid stampsEarned={stampsEarned} stampsRequired={stampsRequired} />
      </div>

      <div className="mt-lg flex items-baseline justify-between">
        <span className="font-mono text-title-lg font-semibold tabular-nums text-ink">
          {stampsEarned} / {stampsRequired}
        </span>
      </div>

      <p className="mt-xs text-body-sm text-muted">
        {isComplete
          ? "Card complete — your next coffee is on us!"
          : `${stampsRemaining} more stamp${stampsRemaining === 1 ? "" : "s"} until your next coffee is free.`}
      </p>

      <div className="mt-lg border-t border-hairline pt-lg">
        <p className="text-center text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted-soft">
          Show this to staff to add a stamp
        </p>
        <div className="mt-sm">
          <CardQRCode value={cardId} />
        </div>
      </div>
    </div>
  );
}

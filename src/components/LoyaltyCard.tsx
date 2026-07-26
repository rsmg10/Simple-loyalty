import CardQRCode from "./CardQRCode";
import Confetti from "./Confetti";
import EmailReminderOptIn from "./EmailReminderOptIn";
import ProgressBar from "./ProgressBar";
import StampGrid from "./StampGrid";
import { getEncouragementCopy } from "@/lib/gamification";

type Shop = {
  name: string;
};

type Card = {
  stampsEarned: number;
  stampsRequired: number;
  email?: string;
};

type LoyaltyCardProps = {
  shop: Shop;
  card: Card;
  cardId: string;
  justRedeemed?: boolean;
};

export default function LoyaltyCard({
  shop,
  card,
  cardId,
  justRedeemed = false,
}: LoyaltyCardProps) {
  const { stampsEarned, stampsRequired } = card;

  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-xl bg-surface-card p-lg sm:p-xl">
      {justRedeemed && (
        <>
          <Confetti />
          <div className="animate-celebrate-in absolute inset-x-lg top-lg rounded-md bg-primary px-md py-xs text-center text-caption font-semibold text-on-primary">
            🎉 Free coffee earned!
          </div>
        </>
      )}

      <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
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

      <div className="mt-xs">
        <ProgressBar stampsEarned={stampsEarned} stampsRequired={stampsRequired} />
      </div>

      <p className="mt-sm text-body-sm text-muted">
        {getEncouragementCopy(stampsEarned, stampsRequired)}
      </p>

      <div className="mt-md">
        <EmailReminderOptIn cardId={cardId} email={card.email} />
      </div>

      <div className="mt-lg border-t border-hairline pt-lg">
        <p className="text-center text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
          Show this to staff to add a stamp
        </p>
        <div className="mt-sm">
          <CardQRCode value={cardId} />
        </div>
      </div>
    </div>
  );
}

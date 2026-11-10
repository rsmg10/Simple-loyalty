import CardQRCode from "./CardQRCode";
import Confetti from "./Confetti";
import EmailReminderOptIn from "./EmailReminderOptIn";
import { useI18n } from "./I18nProvider";
import PhoneOptIn from "./PhoneOptIn";
import ProgressBar from "./ProgressBar";
import StampGrid from "./StampGrid";
import WalletButtons from "./WalletButtons";
import { getEncouragementCopy } from "@/lib/gamification";

type Shop = {
  name: string;
};

type Card = {
  stampsEarned: number;
  stampsRequired: number;
  email?: string;
  phoneHint?: string;
};

type LoyaltyCardProps = {
  shop: Shop;
  card: Card;
  cardId: string;
  justRedeemed?: boolean;
  appleWalletEnabled?: boolean;
  googleWalletEnabled?: boolean;
  emailRemindersEnabled?: boolean;
};

export default function LoyaltyCard({
  shop,
  card,
  cardId,
  justRedeemed = false,
  appleWalletEnabled = false,
  googleWalletEnabled = false,
  emailRemindersEnabled = false,
}: LoyaltyCardProps) {
  const { locale, t } = useI18n();
  const { stampsEarned, stampsRequired } = card;

  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-xl bg-surface-card p-lg sm:p-xl">
      {justRedeemed && (
        <>
          <Confetti />
          <div className="animate-celebrate-in absolute inset-x-lg top-lg rounded-md bg-primary px-md py-xs text-center text-caption font-semibold text-on-primary">
            {t.card.rewardEarned}
          </div>
        </>
      )}

      <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
        {t.card.eyebrow}
      </p>
      <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
        {shop.name}
      </h1>

      <div className="mt-lg">
        <StampGrid
          stampsEarned={stampsEarned}
          stampsRequired={stampsRequired}
          label={t.card.progressLabel(stampsEarned, stampsRequired)}
        />
      </div>

      <div className="mt-lg flex items-baseline justify-between">
        <span dir="ltr" className="font-mono text-title-lg font-semibold tabular-nums text-ink">
          {stampsEarned} / {stampsRequired}
        </span>
      </div>

      <div className="mt-xs">
        <ProgressBar stampsEarned={stampsEarned} stampsRequired={stampsRequired} />
      </div>

      <p className="mt-sm text-body-sm text-muted">
        {getEncouragementCopy(stampsEarned, stampsRequired, locale)}
      </p>

      <div className="mt-md">
        <PhoneOptIn cardId={cardId} phoneHint={card.phoneHint} />
      </div>

      {emailRemindersEnabled && (
        <div className="mt-md">
          <EmailReminderOptIn cardId={cardId} email={card.email} />
        </div>
      )}

      <div className="mt-md">
        <WalletButtons
          cardId={cardId}
          appleWalletEnabled={appleWalletEnabled}
          googleWalletEnabled={googleWalletEnabled}
        />
      </div>

      <div className="mt-lg border-t border-hairline pt-lg">
        <p className="text-center text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
          {t.card.showToStaff}
        </p>
        <div className="mt-sm">
          <CardQRCode value={cardId} label={t.card.qrLabel} />
        </div>
        <p className="mt-sm text-center text-body-sm text-muted">
          {t.card.noCamera}
        </p>
        <p dir="ltr" className="mt-xxs select-all break-all text-center font-mono text-body-sm text-ink">
          {cardId}
        </p>
      </div>
    </div>
  );
}

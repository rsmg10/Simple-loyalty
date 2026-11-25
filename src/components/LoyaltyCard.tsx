import Link from "next/link";
import CardQRCode from "./CardQRCode";
import Confetti from "./Confetti";
import EmailReminderOptIn from "./EmailReminderOptIn";
import HomeScreenPrompt from "./HomeScreenPrompt";
import { useI18n } from "./I18nProvider";
import PhoneOptIn from "./PhoneOptIn";
import ProgressBar from "./ProgressBar";
import StampGrid from "./StampGrid";
import WalletButtons from "./WalletButtons";
import { getEncouragementCopy } from "@/lib/gamification";

type Shop = {
  name: string;
  rewardName: string | null; // null = default reward in the viewer's language
  brandColor: string | null;
  logoUrl: string | null;
  doubleStampsToday: boolean;
};

type Card = {
  stampsEarned: number;
  stampsRequired: number;
  redemptions: number;
  rewardsAvailable: number;
  emailHint?: string;
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
  const reward = shop.rewardName ?? t.defaults.reward;

  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-xl bg-surface-card p-lg sm:p-xl">
      {justRedeemed && (
        <>
          <Confetti />
          <div className="animate-celebrate-in absolute inset-x-lg top-lg z-10 rounded-md bg-primary px-md py-xs text-center text-caption font-semibold text-on-primary">
            {t.card.rewardEarned(reward)}
          </div>
        </>
      )}

      <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
        {t.card.eyebrow}
      </p>
      <div className="mt-xxs flex items-center gap-sm">
        {shop.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- tiny, already-sized image from our own API
          <img src={shop.logoUrl} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-md object-cover" />
        )}
        <h1 className="min-w-0 text-display-sm font-medium tracking-display-sm text-ink">{shop.name}</h1>
      </div>

      {card.rewardsAvailable > 0 && (
        <p
          className="mt-md rounded-md px-md py-sm text-body-sm font-semibold text-on-primary"
          style={{ backgroundColor: shop.brandColor ?? "#0a0a0a" }}
        >
          {t.card.rewardsReady(card.rewardsAvailable, reward)}
        </p>
      )}
      {shop.doubleStampsToday && <p className="mt-sm text-body-sm font-semibold text-ink">{t.card.doubleToday}</p>}

      {/* The QR is what customers need at the counter, so it sits above the
          fold — stamps, opt-ins and the typed-code fallback come after. */}
      <div className="mt-md">
        <CardQRCode value={cardId} size={176} label={t.card.qrLabel} />
        <p className="mt-xs text-center text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
          {t.card.showToStaff}
        </p>
      </div>

      <HomeScreenPrompt cardId={cardId} eligible={stampsEarned > 0 || card.redemptions > 0} />

      <div className="mt-lg">
        <StampGrid
          stampsEarned={stampsEarned}
          stampsRequired={stampsRequired}
          label={t.card.progressLabel(stampsEarned, stampsRequired)}
          color={shop.brandColor}
        />
      </div>

      <div className="mt-lg flex items-baseline justify-between">
        <span dir="ltr" className="font-mono text-title-lg font-semibold tabular-nums text-ink">
          {stampsEarned} / {stampsRequired}
        </span>
      </div>

      <div className="mt-xs">
        <ProgressBar stampsEarned={stampsEarned} stampsRequired={stampsRequired} color={shop.brandColor} />
      </div>

      <p className="mt-sm text-body-sm text-muted">
        {getEncouragementCopy(stampsEarned, stampsRequired, locale, reward)}
      </p>

      <div className="mt-md">
        <PhoneOptIn cardId={cardId} phoneHint={card.phoneHint} />
      </div>

      {emailRemindersEnabled && (
        <div className="mt-md">
          <EmailReminderOptIn cardId={cardId} emailHint={card.emailHint} />
        </div>
      )}

      <div className="mt-md">
        <WalletButtons
          cardId={cardId}
          appleWalletEnabled={appleWalletEnabled}
          googleWalletEnabled={googleWalletEnabled}
        />
      </div>

      <div className="mt-lg border-t border-hairline pt-md">
        <p className="text-center text-body-sm text-muted">{t.card.noCamera}</p>
        <p dir="ltr" className="mt-xxs select-all break-all text-center font-mono text-body-sm text-ink">
          {cardId}
        </p>
        <p className="mt-md text-center">
          <Link href="/privacy" className="text-caption text-muted underline underline-offset-2">
            {t.privacy.link}
          </Link>
        </p>
      </div>
    </div>
  );
}

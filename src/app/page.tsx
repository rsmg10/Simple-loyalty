"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import LanguageToggle from "@/components/LanguageToggle";
import LoyaltyCard from "@/components/LoyaltyCard";
import { markRedemptionsSeen, useOwnCard } from "@/lib/card-store";
import { useShopConfig } from "@/lib/shop-config";

const CELEBRATION_DURATION_MS = 2200;

export default function Home() {
  const { t } = useI18n();
  const { shopName, appleWalletEnabled, googleWalletEnabled, emailRemindersEnabled } = useShopConfig();
  const { cardId, card, loadError, retry } = useOwnCard({
    confirmReplace: () => window.confirm(t.card.replaceConfirm),
  });
  const [justRedeemed, setJustRedeemed] = useState(false);

  useEffect(() => {
    if (!cardId || !card) return;

    // Compares against a value persisted server-side (not just in-memory),
    // so the celebration still fires correctly on a cold reload — e.g. a
    // customer whose phone was locked when staff scanned the winning stamp.
    if (card.redemptions > card.lastSeenRedemptions) {
      setJustRedeemed(true);
      markRedemptionsSeen(cardId);
      const timeout = setTimeout(() => setJustRedeemed(false), CELEBRATION_DURATION_MS);
      return () => clearTimeout(timeout);
    }
  }, [cardId, card]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-md bg-canvas p-lg py-xxl">
      {cardId && card ? (
        <LoyaltyCard
          shop={{ name: shopName }}
          card={card}
          cardId={cardId}
          justRedeemed={justRedeemed}
          appleWalletEnabled={appleWalletEnabled}
          googleWalletEnabled={googleWalletEnabled}
          emailRemindersEnabled={emailRemindersEnabled}
        />
      ) : loadError ? (
        <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-xl text-center">
          <p className="text-body-md text-ink">{t.card.loadError}</p>
          <p className="mt-xs text-body-sm text-muted">{t.card.loadErrorHint}</p>
          <button
            onClick={retry}
            className="mt-lg h-11 w-full rounded-md bg-primary text-button font-semibold text-on-primary"
          >
            {t.card.retry}
          </button>
        </div>
      ) : (
        <p className="text-body-sm text-muted">{t.card.loading}</p>
      )}
      <LanguageToggle />
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import LoyaltyCard from "@/components/LoyaltyCard";
import { markRedemptionsSeen, useOwnCard } from "@/lib/card-store";
import { useShopConfig } from "@/lib/shop-config";

const CELEBRATION_DURATION_MS = 2200;

export default function Home() {
  const { shopName } = useShopConfig();
  const { cardId, card } = useOwnCard();
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
    <main className="flex min-h-screen items-center justify-center bg-canvas p-lg py-xxl">
      {cardId && card ? (
        <LoyaltyCard
          shop={{ name: shopName }}
          card={card}
          cardId={cardId}
          justRedeemed={justRedeemed}
        />
      ) : (
        <p className="text-body-sm text-muted">Loading your card…</p>
      )}
    </main>
  );
}

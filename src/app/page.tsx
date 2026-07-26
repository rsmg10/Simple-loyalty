"use client";

import { useEffect, useRef, useState } from "react";
import LoyaltyCard from "@/components/LoyaltyCard";
import { ensureCard, getOrCreateCardId, useCard } from "@/lib/card-store";

const shop = { name: "Cafe Meridian" };
const CELEBRATION_DURATION_MS = 2200;

export default function Home() {
  const [cardId, setCardId] = useState<string | null>(null);
  const [justRedeemed, setJustRedeemed] = useState(false);
  const prevRedemptions = useRef<number | null>(null);

  useEffect(() => {
    const id = getOrCreateCardId();
    ensureCard(id);
    setCardId(id);
  }, []);

  const card = useCard(cardId);

  useEffect(() => {
    if (!card) return;

    if (prevRedemptions.current !== null && card.redemptions > prevRedemptions.current) {
      setJustRedeemed(true);
      const timeout = setTimeout(() => setJustRedeemed(false), CELEBRATION_DURATION_MS);
      prevRedemptions.current = card.redemptions;
      return () => clearTimeout(timeout);
    }

    prevRedemptions.current = card.redemptions;
  }, [card]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-lg">
      {cardId && card ? (
        <LoyaltyCard
          shop={shop}
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

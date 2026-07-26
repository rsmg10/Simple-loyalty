"use client";

import { useEffect, useState } from "react";
import LoyaltyCard from "@/components/LoyaltyCard";
import { ensureCard, getOrCreateCardId, useCard } from "@/lib/card-store";

const shop = { name: "Cafe Meridian" };

export default function Home() {
  const [cardId, setCardId] = useState<string | null>(null);

  useEffect(() => {
    const id = getOrCreateCardId();
    ensureCard(id);
    setCardId(id);
  }, []);

  const card = useCard(cardId);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-lg">
      {cardId && card ? (
        <LoyaltyCard shop={shop} card={card} cardId={cardId} />
      ) : (
        <p className="text-body-sm text-muted">Loading your card…</p>
      )}
    </main>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CARD_ID_KEY = "loyalty_card_id";
const POLL_INTERVAL_MS = 5000;

export type CardRecord = {
  id: string;
  stampsEarned: number;
  stampsRequired: number;
  redemptions: number;
  lastSeenRedemptions: number;
  email?: string;
};

async function fetchCard(cardId: string): Promise<CardRecord | null> {
  const res = await fetch(`/api/cards/${cardId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getCard(cardId: string): Promise<CardRecord | null> {
  return fetchCard(cardId);
}

export async function addStamp(cardId: string): Promise<CardRecord | null> {
  const res = await fetch(`/api/cards/${cardId}/stamp`, { method: "POST" });
  if (!res.ok) return null;
  return res.json();
}

export async function setCardEmail(cardId: string, email: string): Promise<CardRecord | null> {
  const res = await fetch(`/api/cards/${cardId}/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function markRedemptionsSeen(cardId: string): Promise<CardRecord | null> {
  const res = await fetch(`/api/cards/${cardId}/seen`, { method: "POST" });
  if (!res.ok) return null;
  return res.json();
}

// Owns "my card" on the customer's own device: creates one on first visit,
// remembers its id locally, and polls the server so a stamp added by staff
// on a *different* device shows up here without a manual reload.
export function useOwnCard(): { cardId: string | null; card: CardRecord | null } {
  const [cardId, setCardId] = useState<string | null>(null);
  const [card, setCard] = useState<CardRecord | null>(null);
  const cardIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const id = cardIdRef.current;
    if (!id) return;
    const latest = await fetchCard(id);
    if (latest) setCard(latest);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      let id = window.localStorage.getItem(CARD_ID_KEY);
      let initialCard: CardRecord | null = null;

      if (!id) {
        const res = await fetch("/api/cards", { method: "POST" });
        if (!res.ok || cancelled) return;
        initialCard = (await res.json()) as CardRecord;
        id = initialCard.id;
        window.localStorage.setItem(CARD_ID_KEY, id);
      }

      if (cancelled || !id) return;
      cardIdRef.current = id;
      setCardId(id);

      const latest = initialCard ?? (await fetchCard(id));
      if (!cancelled && latest) setCard(latest);
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!cardId) return;

    // Poll unconditionally — `document.visibilityState` is unreliable across
    // mobile browser/webview contexts (observed stuck on "hidden" for an
    // actively-viewed tab), so gating the interval on it can silently stop
    // a customer from ever seeing a stamp land. Focus/visibilitychange just
    // add an immediate refresh on top of the steady interval.
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [cardId, refresh]);

  return { cardId, card };
}

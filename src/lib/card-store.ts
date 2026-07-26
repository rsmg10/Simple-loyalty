"use client";

import { useCallback, useEffect, useState } from "react";

const CARD_ID_KEY = "loyalty_card_id";
const CARDS_KEY = "loyalty_cards";
const CARD_STORE_EVENT = "cardstore:update";

const DEFAULT_STAMPS_REQUIRED = 9;
const DEMO_SEED_STAMPS_EARNED = 6;
const SHOP_NAME = "Cafe Meridian";

export type CardRecord = {
  stampsEarned: number;
  stampsRequired: number;
  redemptions: number;
  lastSeenRedemptions: number;
  email?: string;
};

function readCards(): Record<string, CardRecord> {
  try {
    const raw = window.localStorage.getItem(CARDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCards(cards: Record<string, CardRecord>) {
  window.localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  // The native "storage" event only fires in other tabs; dispatch our own
  // so the tab that made the change also re-renders.
  window.dispatchEvent(new Event(CARD_STORE_EVENT));
}

function defaultCard(): CardRecord {
  return {
    stampsEarned: 0,
    stampsRequired: DEFAULT_STAMPS_REQUIRED,
    redemptions: 0,
    lastSeenRedemptions: 0,
  };
}

export function getOrCreateCardId(): string {
  let id = window.localStorage.getItem(CARD_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(CARD_ID_KEY, id);
  }
  return id;
}

export function ensureCard(cardId: string): CardRecord {
  const cards = readCards();
  if (!cards[cardId]) {
    cards[cardId] = {
      ...defaultCard(),
      stampsEarned: DEMO_SEED_STAMPS_EARNED,
    };
    writeCards(cards);
  }
  return cards[cardId];
}

export function getCard(cardId: string): CardRecord | null {
  return readCards()[cardId] ?? null;
}

export function addStamp(cardId: string): CardRecord {
  const cards = readCards();
  const current = cards[cardId] ?? defaultCard();

  let { stampsEarned, redemptions } = current;
  stampsEarned += 1;

  if (stampsEarned >= current.stampsRequired) {
    stampsEarned = 0;
    redemptions += 1;
  }

  const updated: CardRecord = { ...current, stampsEarned, redemptions };
  cards[cardId] = updated;
  writeCards(cards);

  const stampsRemaining = updated.stampsRequired - updated.stampsEarned;
  if (stampsRemaining === 1 && updated.email) {
    sendStampReminder(updated.email, stampsRemaining);
  }

  return updated;
}

export function setCardEmail(cardId: string, email: string): CardRecord {
  const cards = readCards();
  const current = cards[cardId] ?? defaultCard();
  const updated: CardRecord = { ...current, email };
  cards[cardId] = updated;
  writeCards(cards);
  return updated;
}

// Marks the customer's current redemption count as "seen" so the
// celebration only fires once per redemption, even across a reload that
// happens long after staff actually scanned the winning stamp.
export function markRedemptionsSeen(cardId: string): CardRecord {
  const cards = readCards();
  const current = cards[cardId] ?? defaultCard();
  const updated: CardRecord = { ...current, lastSeenRedemptions: current.redemptions };
  cards[cardId] = updated;
  writeCards(cards);
  return updated;
}

function sendStampReminder(email: string, stampsRemaining: number) {
  fetch("/api/send-reminder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, shopName: SHOP_NAME, stampsRemaining }),
  }).catch((error) => {
    console.error("Failed to send stamp reminder", error);
  });
}

export function useCard(cardId: string | null): CardRecord | null {
  const [card, setCard] = useState<CardRecord | null>(null);

  const refresh = useCallback(() => {
    if (!cardId) return;
    setCard(getCard(cardId));
  }, [cardId]);

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(CARD_STORE_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(CARD_STORE_EVENT, refresh);
    };
  }, [refresh]);

  return card;
}

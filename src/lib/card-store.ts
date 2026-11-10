"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CARD_ID_KEY = "loyalty_card_id";
const POLL_INTERVAL_MS = 5000;
// Query parameter on the "move card to this phone" link the staff screen
// shows as a QR code.
export const SHARED_CARD_PARAM = "card";

const CARD_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isCardId(value: string): boolean {
  return CARD_ID_PATTERN.test(value);
}

export type CardRecord = {
  id: string;
  stampsEarned: number;
  stampsRequired: number;
  redemptions: number;
  lastSeenRedemptions: number;
  email?: string;
  phoneHint?: string;
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

export type SetPhoneResult =
  | { ok: true; card: CardRecord }
  | { ok: false; reason: "invalid" | "taken" | "failed" };

export async function setCardPhone(cardId: string, phone: string): Promise<SetPhoneResult> {
  try {
    const res = await fetch(`/api/cards/${cardId}/phone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (res.ok) return { ok: true, card: await res.json() };
    if (res.status === 400) return { ok: false, reason: "invalid" };
    if (res.status === 409) return { ok: false, reason: "taken" };
    return { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

// Staff-only (needs the staff session cookie). `status` lets the caller
// tell an expired session (401) apart from "no such card".
export async function lookupCardByPhone(phone: string): Promise<{ card: CardRecord | null; status: number }> {
  try {
    const res = await fetch("/api/staff/card-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    return { card: res.ok ? await res.json() : null, status: res.status };
  } catch {
    return { card: null, status: 0 };
  }
}

// Reads (and strips from the address bar) a card id handed over by staff
// via the "move card to this phone" QR code.
function takeSharedCardId(): string | null {
  const url = new URL(window.location.href);
  const shared = url.searchParams.get(SHARED_CARD_PARAM);
  if (shared === null) return null;
  url.searchParams.delete(SHARED_CARD_PARAM);
  window.history.replaceState(null, "", url.toString());
  return isCardId(shared) ? shared : null;
}

function hasProgress(card: CardRecord | null): boolean {
  return Boolean(card && (card.stampsEarned > 0 || card.redemptions > 0));
}

export async function markRedemptionsSeen(cardId: string): Promise<CardRecord | null> {
  const res = await fetch(`/api/cards/${cardId}/seen`, { method: "POST" });
  if (!res.ok) return null;
  return res.json();
}

// Owns "my card" on the customer's own device: creates one on first visit,
// remembers its id locally, and polls the server so a stamp added by staff
// on a *different* device shows up here without a manual reload.
//
// If the page was opened from a staff-shared link, that card replaces the
// one stored on this device — asking first (`confirmReplace`) only when the
// current card already has stamps, since the swap would hide it from here.
export function useOwnCard(options?: { confirmReplace?: () => boolean }): {
  cardId: string | null;
  card: CardRecord | null;
  loadError: boolean;
  retry: () => void;
} {
  const [cardId, setCardId] = useState<string | null>(null);
  const [card, setCard] = useState<CardRecord | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const cardIdRef = useRef<string | null>(null);
  const confirmReplaceRef = useRef(options?.confirmReplace);
  confirmReplaceRef.current = options?.confirmReplace;
  // Read once per mount: the param is stripped from the URL on first read,
  // and a re-run effect (React strict mode, retry) must still see it.
  const sharedIdRef = useRef<string | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    const id = cardIdRef.current;
    if (!id) return;
    const latest = await fetchCard(id);
    if (latest) setCard(latest);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoadError(false);
      try {
        let id = window.localStorage.getItem(CARD_ID_KEY);
        let initialCard: CardRecord | null = null;

        if (sharedIdRef.current === undefined) sharedIdRef.current = takeSharedCardId();
        const sharedId = sharedIdRef.current;
        if (sharedId && sharedId !== id) {
          const shared = await fetchCard(sharedId);
          const current = shared && id ? await fetchCard(id) : null;
          if (cancelled) return;
          const confirmReplace = confirmReplaceRef.current ?? (() => true);
          if (shared && (!hasProgress(current) || confirmReplace())) {
            id = sharedId;
            initialCard = shared;
            window.localStorage.setItem(CARD_ID_KEY, id);
          }
        }

        if (!id) {
          const res = await fetch("/api/cards", { method: "POST" });
          if (!res.ok) throw new Error("Failed to create card");
          initialCard = (await res.json()) as CardRecord;
          id = initialCard.id;
          window.localStorage.setItem(CARD_ID_KEY, id);
        }

        if (cancelled || !id) return;
        cardIdRef.current = id;
        setCardId(id);

        const latest = initialCard ?? (await fetchCard(id));
        if (cancelled) return;
        if (!latest) throw new Error("Failed to load card");
        setCard(latest);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

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

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { cardId, card, loadError, retry };
}

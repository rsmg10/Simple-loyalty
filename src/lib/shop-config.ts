"use client";

import { useEffect, useState } from "react";

export type ShopConfig = {
  shopName: string;
  stampsRequired: number;
  loading: boolean;
};

export function useShopConfig(): ShopConfig {
  const [shopName, setShopName] = useState("");
  const [stampsRequired, setStampsRequired] = useState(9);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/shop")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { name: string; stampsRequired: number }) => {
        if (cancelled) return;
        setShopName(data.name);
        setStampsRequired(data.stampsRequired);
      })
      .catch((error) => {
        console.error("Failed to load shop config", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { shopName, stampsRequired, loading };
}

export type ShopStats = {
  totalCards: number;
  totalStampsGiven: number;
  totalRedemptions: number;
  loading: boolean;
};

export function useShopStats(): ShopStats {
  const [totalCards, setTotalCards] = useState(0);
  const [totalStampsGiven, setTotalStampsGiven] = useState(0);
  const [totalRedemptions, setTotalRedemptions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/shop/stats")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { totalCards: number; totalStampsGiven: number; totalRedemptions: number }) => {
        if (cancelled) return;
        setTotalCards(data.totalCards);
        setTotalStampsGiven(data.totalStampsGiven);
        setTotalRedemptions(data.totalRedemptions);
      })
      .catch((error) => {
        console.error("Failed to load shop stats", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { totalCards, totalStampsGiven, totalRedemptions, loading };
}

export async function saveShopConfig(config: {
  shopName: string;
  stampsRequired: number;
  staffPin?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/shop", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: config.shopName,
      stampsRequired: config.stampsRequired,
      staffPin: config.staffPin,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return { ok: false, error: data?.error ?? "Failed to save shop config." };
  }
  return { ok: true };
}

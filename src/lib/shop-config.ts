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

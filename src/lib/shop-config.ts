"use client";

import { useCallback, useEffect, useState } from "react";
import type { CustomerJson } from "./customer-list";
import type { ShopStatsJson } from "./shop-stats";

export type ShopConfig = {
  shopName: string;
  stampsRequired: number;
  rewardName: string | null; // null = the default reward in the viewer's language
  brandColor: string | null;
  logoUrl: string | null;
  welcomeBonus: number;
  doubleStampWeekdays: number[];
  doubleStampsToday: boolean;
  appleWalletEnabled: boolean;
  googleWalletEnabled: boolean;
  emailRemindersEnabled: boolean;
  loading: boolean;
  reload: () => void;
};

type ShopConfigJson = Omit<ShopConfig, "shopName" | "loading" | "reload"> & { name: string };

const DEFAULT_CONFIG: ShopConfigJson = {
  name: "",
  stampsRequired: 9,
  rewardName: null,
  brandColor: null,
  logoUrl: null,
  welcomeBonus: 0,
  doubleStampWeekdays: [],
  doubleStampsToday: false,
  appleWalletEnabled: false,
  googleWalletEnabled: false,
  emailRemindersEnabled: false,
};

export function useShopConfig(): ShopConfig {
  const { data, loading, reload } = useJson<ShopConfigJson>("/api/shop");
  const { name, ...config } = { ...DEFAULT_CONFIG, ...data };
  return { shopName: name, ...config, loading, reload };
}

// GETs JSON from one of the app's own routes, with a reload for after a
// change. `error` covers network failures and non-2xx responses alike.
export function useJson<T>(url: string): { data: T | null; loading: boolean; error: boolean; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: T) => {
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      })
      .catch((err) => {
        console.error(`Failed to load ${url}`, err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { data, loading, error, reload };
}

export type ShopStats = ShopStatsJson & { loading: boolean };

const EMPTY_STATS: ShopStatsJson = {
  totalCards: 0,
  totalStampsGiven: 0,
  totalRedemptions: 0,
  stampedCustomers: 0,
  returningCustomers: 0,
  activeCustomers: 0,
};

export function useShopStats(): ShopStats {
  const [stats, setStats] = useState<ShopStatsJson>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/shop/stats")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: ShopStatsJson) => {
        if (!cancelled) setStats(data);
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

  return { ...stats, loading };
}

export function useShopCustomers(): { customers: CustomerJson[]; loading: boolean; error: boolean } {
  const [customers, setCustomers] = useState<CustomerJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/shop/customers")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { customers: CustomerJson[] }) => {
        if (!cancelled) setCustomers(data.customers);
      })
      .catch((err) => {
        console.error("Failed to load customers", err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { customers, loading, error };
}

export async function saveShopConfig(config: {
  shopName: string;
  stampsRequired: number;
  staffPin?: string;
  rewardName?: string | null;
  brandColor?: string | null;
  welcomeBonus?: number;
  doubleStampWeekdays?: number[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { shopName, ...rest } = config;
  const res = await fetch("/api/shop", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: shopName, ...rest }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return { ok: false, error: data?.error ?? "Failed to save shop config." };
  }
  return { ok: true };
}

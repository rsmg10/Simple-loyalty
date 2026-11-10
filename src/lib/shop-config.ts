"use client";

import { useEffect, useState } from "react";
import type { CustomerJson } from "./customer-list";
import type { ShopStatsJson } from "./shop-stats";

export type ShopConfig = {
  shopName: string;
  stampsRequired: number;
  appleWalletEnabled: boolean;
  googleWalletEnabled: boolean;
  emailRemindersEnabled: boolean;
  loading: boolean;
};

export function useShopConfig(): ShopConfig {
  const [shopName, setShopName] = useState("");
  const [stampsRequired, setStampsRequired] = useState(9);
  const [appleWalletEnabled, setAppleWalletEnabled] = useState(false);
  const [googleWalletEnabled, setGoogleWalletEnabled] = useState(false);
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/shop")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(
        (data: {
          name: string;
          stampsRequired: number;
          appleWalletEnabled: boolean;
          googleWalletEnabled: boolean;
          emailRemindersEnabled: boolean;
        }) => {
          if (cancelled) return;
          setShopName(data.name);
          setStampsRequired(data.stampsRequired);
          setAppleWalletEnabled(data.appleWalletEnabled);
          setGoogleWalletEnabled(data.googleWalletEnabled);
          setEmailRemindersEnabled(data.emailRemindersEnabled);
        },
      )
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

  return { shopName, stampsRequired, appleWalletEnabled, googleWalletEnabled, emailRemindersEnabled, loading };
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

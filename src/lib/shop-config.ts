"use client";

import { useCallback, useEffect, useState } from "react";

const SHOP_CONFIG_KEY = "loyalty_shop_config";
const SHOP_CONFIG_EVENT = "shopconfig:update";

export type ShopConfig = {
  shopName: string;
  stampsRequired: number;
  staffPin: string;
};

export const DEFAULT_SHOP_CONFIG: ShopConfig = {
  shopName: "Cafe Meridian",
  stampsRequired: 9,
  staffPin: "1234",
};

export function getShopConfig(): ShopConfig {
  try {
    const raw = window.localStorage.getItem(SHOP_CONFIG_KEY);
    if (!raw) return DEFAULT_SHOP_CONFIG;
    return { ...DEFAULT_SHOP_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SHOP_CONFIG;
  }
}

export function setShopConfig(config: ShopConfig) {
  window.localStorage.setItem(SHOP_CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(SHOP_CONFIG_EVENT));
}

export function useShopConfig(): ShopConfig {
  const [config, setConfig] = useState<ShopConfig>(DEFAULT_SHOP_CONFIG);

  const refresh = useCallback(() => {
    setConfig(getShopConfig());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(SHOP_CONFIG_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(SHOP_CONFIG_EVENT, refresh);
    };
  }, [refresh]);

  return config;
}

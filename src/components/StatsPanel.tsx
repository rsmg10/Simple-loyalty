"use client";

import { useI18n } from "./I18nProvider";
import { eyebrowClass, panelClass } from "./ui";
import { useShopStats } from "@/lib/shop-config";
import { returnRatePercent } from "@/lib/shop-stats";

export default function StatsPanel() {
  const { t } = useI18n();
  const stats = useShopStats();
  const returnRate = returnRatePercent(stats);
  const value = (n: number | string) => (stats.loading ? "–" : n);

  const tiles: [string, number | string][] = [
    [t.setup.cardsIssued, value(stats.totalCards)],
    [t.setup.stampsGiven, value(stats.totalStampsGiven)],
    [t.setup.redemptions, value(stats.totalRedemptions)],
    [t.setup.returningCustomers, value(stats.returningCustomers)],
    [t.setup.returnRate, returnRate === null ? "–" : value(`${returnRate}%`)],
    [t.setup.activeCustomers, value(stats.activeCustomers)],
  ];

  return (
    <div className={panelClass}>
      <p className={eyebrowClass}>{t.setup.statsEyebrow}</p>
      <div className="mt-md grid grid-cols-3 gap-md">
        {tiles.map(([label, n]) => (
          <div key={label}>
            <p className="text-title-lg font-semibold tabular-nums text-ink">{n}</p>
            <p className={`mt-xxs ${eyebrowClass} font-normal`}>{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-md text-caption text-muted">{t.setup.statsNote}</p>
    </div>
  );
}

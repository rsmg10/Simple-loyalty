"use client";

import { useState } from "react";
import { useI18n } from "./I18nProvider";
import { eyebrowClass, panelClass } from "./ui";
import { useJson } from "@/lib/shop-config";
import type { TrendWeek } from "@/lib/trends";

type Metric = "visits" | "newCustomers" | "rewardsUsed";
const METRICS: Metric[] = ["visits", "newCustomers", "rewardsUsed"];

// Plain bars, one per week, oldest first — enough to answer "is it
// growing?" without a chart library.
export default function TrendsChart() {
  const { t } = useI18n();
  const { data, loading, error } = useJson<{ weeks: TrendWeek[] }>("/api/shop/trends");
  const [metric, setMetric] = useState<Metric>("visits");
  const weeks = data?.weeks ?? [];
  const max = Math.max(1, ...weeks.map((week) => week[metric]));

  return (
    <div className={panelClass}>
      <p className={eyebrowClass}>{t.trends.title}</p>
      <div className="mt-sm flex flex-wrap gap-xs" role="tablist">
        {METRICS.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={metric === m}
            onClick={() => setMetric(m)}
            className={`h-9 rounded-pill px-sm text-caption font-semibold ${
              metric === m ? "bg-primary text-on-primary" : "border border-hairline text-ink"
            }`}
          >
            {t.trends[m]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-md text-body-sm text-muted">…</p>
      ) : error ? (
        <p className="mt-md text-body-sm text-error">{t.customers.loadError}</p>
      ) : (
        <div
          className="mt-md flex h-40 items-end gap-xs"
          role="img"
          aria-label={weeks.map((week) => `${week.weeksAgo === 0 ? t.trends.thisWeek : t.trends.weeksAgo(week.weeksAgo)}: ${week[metric]}`).join(", ")}
        >
          {weeks.map((week) => (
            <div key={week.weeksAgo} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-xxs">
              <span className="text-caption tabular-nums text-ink">{week[metric]}</span>
              <div
                className={`w-full rounded-t-sm ${week.weeksAgo === 0 ? "bg-primary" : "bg-muted-soft"}`}
                style={{ height: `${Math.max(2, (week[metric] / max) * 100)}%` }}
              />
              <span className="w-full truncate text-center text-[10px] leading-tight text-muted">
                {week.weeksAgo === 0 ? t.trends.thisWeek : t.trends.weeksAgo(week.weeksAgo)}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-md text-caption text-muted">{t.trends.note}</p>
    </div>
  );
}

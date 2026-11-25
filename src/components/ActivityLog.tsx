"use client";

import { useI18n } from "./I18nProvider";
import { eyebrowClass, panelClass } from "./ui";
import type { ActivityJson } from "@/lib/activity";
import { formatDate } from "@/lib/format";
import type { Messages } from "@/lib/i18n/messages";
import { useJson } from "@/lib/shop-config";

export function describeActivity(event: ActivityJson, t: Messages): string {
  if (event.kind === "redeem") return t.activity.redeem;
  if (event.kind === "adjust") return t.activity.adjust(event.stampsAdded);
  const stamps = t.activity.stamp(event.stampsAdded, event.bonusStamps);
  return event.rewardsEarned > 0 ? `${stamps} · ${t.activity.rewardEarned}` : stamps;
}

export function ActivityItem({ event, showCustomer = true }: { event: ActivityJson; showCustomer?: boolean }) {
  const { locale, t } = useI18n();
  return (
    <li className={`py-sm ${event.undone ? "opacity-50" : ""}`}>
      <p className="text-body-sm text-ink">
        <span className={event.undone ? "line-through" : ""}>{describeActivity(event, t)}</span>
        {event.undone && <span className="ms-xs text-caption text-muted">({t.activity.undone})</span>}
      </p>
      <p className="text-caption text-muted">
        {showCustomer && (
          <>
            <bdi dir="ltr">{event.customer}</bdi>
            {" · "}
          </>
        )}
        {event.staffName ?? t.activity.manager} · {formatDate(event.createdAt, locale, true)}
      </p>
    </li>
  );
}

// Every stamp, reward and correction at the counter, newest first, with who
// did it.
export default function ActivityLog() {
  const { t } = useI18n();
  const { data, loading, error } = useJson<{ events: ActivityJson[] }>("/api/shop/activity");

  return (
    <div className={panelClass}>
      <p className={eyebrowClass}>{t.activity.title}</p>
      {loading ? (
        <p className="mt-md text-body-sm text-muted">…</p>
      ) : error ? (
        <p className="mt-md text-body-sm text-error">{t.customers.loadError}</p>
      ) : !data?.events.length ? (
        <p className="mt-md text-body-sm text-muted">{t.activity.empty}</p>
      ) : (
        <ul className="mt-sm max-h-[28rem] divide-y divide-hairline overflow-y-auto">
          {data.events.map((event) => (
            <ActivityItem key={event.id} event={event} />
          ))}
        </ul>
      )}
    </div>
  );
}

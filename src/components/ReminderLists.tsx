"use client";

import { useI18n } from "./I18nProvider";
import { eyebrowClass, panelClass } from "./ui";
import { whatsAppUrl } from "@/lib/customer-list";
import type { ReminderCustomer } from "@/lib/reminders";
import { useJson, useShopConfig } from "@/lib/shop-config";

type Lists = { oneAway: ReminderCustomer[]; rewardWaiting: ReminderCustomer[]; lapsed: ReminderCustomer[] };

// Semi-automatic reminders: the app picks who to message and writes the
// message; the owner taps WhatsApp to send it from their own phone. No
// messaging provider, no per-message cost.
export default function ReminderLists() {
  const { t } = useI18n();
  const config = useShopConfig();
  const { data, loading, error } = useJson<Lists>("/api/shop/reminders");
  const reward = config.rewardName ?? t.defaults.reward;

  const sections: { key: keyof Lists; title: string; message: string }[] = [
    { key: "oneAway", title: t.reminders.oneAway, message: t.reminders.oneAwayMessage(config.shopName, reward) },
    { key: "rewardWaiting", title: t.reminders.rewardWaiting, message: t.reminders.rewardWaitingMessage(config.shopName, reward) },
    { key: "lapsed", title: t.reminders.lapsed, message: t.reminders.lapsedMessage(config.shopName) },
  ];

  return (
    <div className={panelClass}>
      <p className={eyebrowClass}>{t.reminders.title}</p>
      <p className="mt-xs text-body-sm text-muted">{t.reminders.description}</p>
      {loading ? (
        <p className="mt-md text-body-sm text-muted">…</p>
      ) : error || !data ? (
        <p className="mt-md text-body-sm text-error">{t.customers.loadError}</p>
      ) : (
        sections.map(({ key, title, message }) => (
          <section key={key} className="mt-md">
            <h3 className="text-title-sm font-semibold text-ink">
              {title} ({data[key].length})
            </h3>
            {data[key].length === 0 ? (
              <p className="mt-xxs text-body-sm text-muted">{t.reminders.empty}</p>
            ) : (
              <ul className="mt-xxs max-h-60 divide-y divide-hairline overflow-y-auto">
                {data[key].map((customer) => (
                  <li key={customer.phone} className="flex items-center justify-between gap-sm py-xs">
                    <span className="font-mono text-body-sm text-ink">
                      <bdi dir="ltr">{customer.phone}</bdi>
                    </span>
                    <a
                      href={whatsAppUrl(customer.phone, message)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 shrink-0 items-center rounded-md border border-hairline px-sm text-button font-semibold text-ink"
                    >
                      {t.customers.whatsApp}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}
    </div>
  );
}

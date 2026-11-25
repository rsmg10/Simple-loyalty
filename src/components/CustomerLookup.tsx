"use client";

import { useState, type FormEvent } from "react";
import { ActivityItem } from "./ActivityLog";
import { useI18n } from "./I18nProvider";
import { eyebrowClass, inputClass, linkButtonClass, panelClass, secondaryButtonClass } from "./ui";
import type { CustomerDetailJson } from "@/lib/customer-detail";
import { formatDate } from "@/lib/format";

// Owner tool: find a customer by phone or card code, see their card and
// history, fix their stamp count, or delete the card on request.
export default function CustomerLookup() {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState<CustomerDetailJson | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [stamps, setStamps] = useState("");
  const [busy, setBusy] = useState(false);

  function show(detail: CustomerDetailJson) {
    setCustomer(detail);
    setStamps(String(detail.stampsEarned));
  }

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setMessage(null);
    setCustomer(null);
    const res = await fetch("/api/shop/cards/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    }).catch(() => null);
    if (!res?.ok) {
      setBusy(false);
      setMessage(res?.status === 400 ? t.lookup.invalid : t.lookup.notFound);
      return;
    }
    const { cardId } = (await res.json()) as { cardId: string };
    const detail = await fetch(`/api/shop/cards/${cardId}`).catch(() => null);
    setBusy(false);
    if (detail?.ok) show(await detail.json());
    else setMessage(t.lookup.notFound);
  }

  async function handleSetStamps(event: FormEvent) {
    event.preventDefault();
    if (!customer) return;
    setBusy(true);
    const res = await fetch(`/api/shop/cards/${customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stampsEarned: Number(stamps) }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) show(await res.json());
    else setMessage(t.setup.stampsRange(0, customer.stampsRequired - 1));
  }

  async function handleDelete() {
    if (!customer || !window.confirm(t.lookup.deleteConfirm)) return;
    setBusy(true);
    const res = await fetch(`/api/shop/cards/${customer.id}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setCustomer(null);
      setQuery("");
      setMessage(t.lookup.deleted);
    }
  }

  const facts: [string, string][] = customer
    ? [
        [t.lookup.stamps, `${customer.stampsEarned} / ${customer.stampsRequired}`],
        [t.lookup.rewardsSaved, String(customer.rewardsAvailable)],
        [t.lookup.visits, String(customer.visits)],
        [t.lookup.lastVisit, customer.lastStampedAt ? formatDate(customer.lastStampedAt, locale) : "–"],
        [t.lookup.joined, formatDate(customer.createdAt, locale)],
        [t.lookup.phone, customer.phone ?? t.lookup.noPhone],
      ]
    : [];

  return (
    <div className={panelClass}>
      <p className={eyebrowClass}>{t.lookup.title}</p>
      <form onSubmit={handleSearch} className="mt-sm flex gap-xs">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          dir={query ? "ltr" : undefined}
          inputMode="tel"
          autoComplete="off"
          placeholder={t.lookup.placeholder}
          aria-label={t.lookup.placeholder}
          className={`${inputClass} min-w-0 flex-1`}
        />
        <button type="submit" disabled={busy} className={secondaryButtonClass}>
          {t.lookup.search}
        </button>
      </form>
      {message && (
        <p className="mt-sm text-body-sm text-muted" role="status">
          {message}
        </p>
      )}

      {customer && (
        <div className="mt-md border-t border-hairline pt-md">
          <dl className="grid grid-cols-2 gap-sm">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-caption text-muted">{label}</dt>
                <dd className="text-body-sm font-semibold text-ink">
                  <bdi dir="ltr">{value}</bdi>
                </dd>
              </div>
            ))}
          </dl>

          <form onSubmit={handleSetStamps} className="mt-md flex items-end gap-xs">
            <label className="min-w-0 flex-1">
              <span className="text-caption text-muted">{t.lookup.setStamps}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={customer.stampsRequired - 1}
                value={stamps}
                onChange={(event) => setStamps(event.target.value)}
                className={`${inputClass} mt-xxs`}
              />
            </label>
            <button type="submit" disabled={busy} className={secondaryButtonClass}>
              {t.lookup.saveStamps}
            </button>
          </form>

          <p className="mt-md text-title-sm font-semibold text-ink">{t.lookup.history}</p>
          {customer.history.length ? (
            <ul className="divide-y divide-hairline">
              {customer.history.map((event) => (
                <ActivityItem key={event.id} event={event} showCustomer={false} />
              ))}
            </ul>
          ) : (
            <p className="mt-xs text-body-sm text-muted">{t.lookup.noHistory}</p>
          )}

          <div className="mt-md flex justify-between gap-sm">
            <button type="button" onClick={() => setCustomer(null)} className={linkButtonClass}>
              {t.lookup.close}
            </button>
            <button type="button" onClick={handleDelete} disabled={busy} className="text-body-sm text-error underline underline-offset-2">
              {t.lookup.deleteCard}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

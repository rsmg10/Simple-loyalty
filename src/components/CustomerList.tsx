"use client";

import { useState } from "react";
import { useI18n } from "./I18nProvider";
import { whatsAppUrl } from "@/lib/customer-list";
import { useShopCustomers } from "@/lib/shop-config";

const COPIED_FEEDBACK_MS = 2000;

export default function CustomerList() {
  const { locale, t } = useI18n();
  const { customers, loading, error } = useShopCustomers();
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Latin digits in Arabic too — that's what Libyan phones show by default.
  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-LY-u-nu-latn" : "en", { dateStyle: "medium" });

  async function copyAllNumbers() {
    try {
      await navigator.clipboard.writeText(customers.map((customer) => customer.phone).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Clipboard blocked (non-HTTPS or permission denied) — nothing useful to show.
    }
  }

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-xl">
      <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
        {t.customers.eyebrow}
      </p>
      <h2 className="mt-xxs text-title-lg font-medium text-ink">{t.customers.title(customers.length)}</h2>
      <p className="mt-xs text-body-sm text-muted">{t.customers.description}</p>

      {loading ? (
        <p className="mt-md text-body-sm text-muted">…</p>
      ) : error ? (
        <p className="mt-md text-body-sm text-error" role="alert">
          {t.customers.loadError}
        </p>
      ) : customers.length === 0 ? (
        <p className="mt-md text-body-sm text-muted">{t.customers.empty}</p>
      ) : (
        <>
          <label className="mt-md block">
            <span className="text-title-sm font-semibold text-ink">{t.customers.messageLabel}</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t.customers.messagePlaceholder}
              rows={2}
              className="mt-xxs w-full rounded-md border border-hairline bg-canvas px-md py-xs text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
            />
          </label>

          <ul className="mt-md max-h-96 divide-y divide-hairline overflow-y-auto">
            {customers.map((customer) => (
              <li key={customer.phone} className="flex items-center justify-between gap-sm py-sm">
                <div className="min-w-0">
                  <p className="font-mono text-body-sm text-ink">
                    <bdi dir="ltr">{customer.phone}</bdi>
                  </p>
                  <p className="text-caption text-muted">
                    {customer.lastStampedAt
                      ? `${t.customers.stamps(customer.lifetimeStamps)} · ${t.customers.lastVisit(
                          dateFormat.format(new Date(customer.lastStampedAt)),
                        )}`
                      : customer.lifetimeStamps > 0
                        ? t.customers.stamps(customer.lifetimeStamps)
                        : t.customers.neverStamped}
                  </p>
                </div>
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

          <button
            type="button"
            onClick={copyAllNumbers}
            className="mt-md h-11 w-full rounded-md border border-hairline text-button font-semibold text-ink"
          >
            {copied ? t.customers.copied : t.customers.copyAll}
          </button>
        </>
      )}
    </div>
  );
}

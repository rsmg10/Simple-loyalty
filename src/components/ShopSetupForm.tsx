"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useI18n } from "./I18nProvider";
import CustomerList from "./CustomerList";
import { saveShopConfig, useShopConfig, useShopStats } from "@/lib/shop-config";
import { returnRatePercent } from "@/lib/shop-stats";

const MIN_STAMPS_REQUIRED = 3;
const MAX_STAMPS_REQUIRED = 20;

export default function ShopSetupForm() {
  const { locale, t } = useI18n();
  const { shopName: currentName, stampsRequired: currentStamps, loading } = useShopConfig();
  const stats = useShopStats();
  const { totalCards, totalStampsGiven, totalRedemptions, returningCustomers, activeCustomers } = stats;
  const statsLoading = stats.loading;
  const returnRate = returnRatePercent(stats);
  const [shopName, setShopName] = useState("");
  const [stampsRequired, setStampsRequired] = useState("");
  const [staffPin, setStaffPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Seed the form once the current config has loaded — not on every
  // change, or it would clobber the owner's in-progress edits.
  useEffect(() => {
    if (!loading) {
      setShopName(currentName);
      setStampsRequired(String(currentStamps));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);

    const trimmedName = shopName.trim();
    const stampsNumber = Number(stampsRequired);
    const trimmedPin = staffPin.trim();

    if (!trimmedName) {
      setError(t.setup.nameEmpty);
      return;
    }
    if (
      !Number.isInteger(stampsNumber) ||
      stampsNumber < MIN_STAMPS_REQUIRED ||
      stampsNumber > MAX_STAMPS_REQUIRED
    ) {
      setError(t.setup.stampsRange(MIN_STAMPS_REQUIRED, MAX_STAMPS_REQUIRED));
      return;
    }
    if (trimmedPin && trimmedPin.length < 4) {
      setError(t.setup.pinTooShort);
      return;
    }

    setError(null);
    setSubmitting(true);
    const result = await saveShopConfig({
      shopName: trimmedName,
      stampsRequired: stampsNumber,
      staffPin: trimmedPin || undefined,
    });
    setSubmitting(false);

    if (!result.ok) {
      // Server messages are English-only; Arabic gets the generic message.
      setError(locale === "en" ? result.error : t.setup.saveFailed);
      return;
    }
    setStaffPin("");
    setSaved(true);
  }

  return (
    <div className="w-full max-w-sm space-y-lg">
      <div className="rounded-lg border border-hairline bg-canvas p-xl">
        <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
          {t.setup.statsEyebrow}
        </p>
        <div className="mt-md grid grid-cols-3 gap-md">
          <div>
            <p className="text-title-lg font-semibold tabular-nums text-ink">
              {statsLoading ? "–" : totalCards}
            </p>
            <p className="mt-xxs text-caption-uppercase uppercase tracking-caption-uppercase text-muted">
              {t.setup.cardsIssued}
            </p>
          </div>
          <div>
            <p className="text-title-lg font-semibold tabular-nums text-ink">
              {statsLoading ? "–" : totalStampsGiven}
            </p>
            <p className="mt-xxs text-caption-uppercase uppercase tracking-caption-uppercase text-muted">
              {t.setup.stampsGiven}
            </p>
          </div>
          <div>
            <p className="text-title-lg font-semibold tabular-nums text-ink">
              {statsLoading ? "–" : totalRedemptions}
            </p>
            <p className="mt-xxs text-caption-uppercase uppercase tracking-caption-uppercase text-muted">
              {t.setup.redemptions}
            </p>
          </div>
          <div>
            <p className="text-title-lg font-semibold tabular-nums text-ink">
              {statsLoading ? "–" : returningCustomers}
            </p>
            <p className="mt-xxs text-caption-uppercase uppercase tracking-caption-uppercase text-muted">
              {t.setup.returningCustomers}
            </p>
          </div>
          <div>
            <p className="text-title-lg font-semibold tabular-nums text-ink">
              {statsLoading || returnRate === null ? "–" : `${returnRate}%`}
            </p>
            <p className="mt-xxs text-caption-uppercase uppercase tracking-caption-uppercase text-muted">
              {t.setup.returnRate}
            </p>
          </div>
          <div>
            <p className="text-title-lg font-semibold tabular-nums text-ink">
              {statsLoading ? "–" : activeCustomers}
            </p>
            <p className="mt-xxs text-caption-uppercase uppercase tracking-caption-uppercase text-muted">
              {t.setup.activeCustomers}
            </p>
          </div>
        </div>
        <p className="mt-md text-caption text-muted">{t.setup.statsNote}</p>
      </div>

      <CustomerList />

      <div className="rounded-lg border border-hairline bg-canvas p-xl">
        <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
          {t.setup.eyebrow}
        </p>
        <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
          {t.setup.title}
        </h1>
        <p className="mt-xs text-body-sm text-muted">
          {t.setup.description}
        </p>

        <form onSubmit={handleSubmit} className="mt-lg space-y-md">
          <label className="block">
            <span className="text-title-sm font-semibold text-ink">{t.setup.shopName}</span>
            <input
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
              className="mt-xxs h-11 w-full rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
            />
          </label>

          <label className="block">
            <span className="text-title-sm font-semibold text-ink">{t.setup.stampsRequired}</span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_STAMPS_REQUIRED}
              max={MAX_STAMPS_REQUIRED}
              value={stampsRequired}
              onChange={(event) => setStampsRequired(event.target.value)}
              className="mt-xxs h-11 w-full rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
            />
          </label>

          <label className="block">
            <span className="text-title-sm font-semibold text-ink">{t.setup.newPin}</span>
            <input
              value={staffPin}
              onChange={(event) => setStaffPin(event.target.value)}
              inputMode="numeric"
              placeholder={t.setup.newPinPlaceholder}
              className="mt-xxs h-11 w-full rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
            />
          </label>

          {error && (
            <p className="text-body-sm text-error" role="alert">
              {error}
            </p>
          )}
          {saved && !error && (
            <p className="text-body-sm text-muted" role="status">
              {t.setup.saved}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-md bg-primary text-button font-semibold text-on-primary disabled:opacity-60"
          >
            {t.setup.save}
          </button>
        </form>
      </div>
    </div>
  );
}

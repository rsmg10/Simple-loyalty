"use client";

import { useEffect, useState, type FormEvent } from "react";
import { saveShopConfig, useShopConfig, useShopStats } from "@/lib/shop-config";

const MIN_STAMPS_REQUIRED = 3;
const MAX_STAMPS_REQUIRED = 20;

export default function ShopSetupForm() {
  const { shopName: currentName, stampsRequired: currentStamps, loading } = useShopConfig();
  const { totalCards, totalStampsGiven, totalRedemptions, loading: statsLoading } = useShopStats();
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
      setError("Shop name can't be empty.");
      return;
    }
    if (
      !Number.isInteger(stampsNumber) ||
      stampsNumber < MIN_STAMPS_REQUIRED ||
      stampsNumber > MAX_STAMPS_REQUIRED
    ) {
      setError(`Stamps required must be a whole number between ${MIN_STAMPS_REQUIRED} and ${MAX_STAMPS_REQUIRED}.`);
      return;
    }
    if (trimmedPin && trimmedPin.length < 4) {
      setError("Staff PIN must be at least 4 characters.");
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
      setError(result.error);
      return;
    }
    setStaffPin("");
    setSaved(true);
  }

  return (
    <div className="w-full max-w-sm space-y-lg">
      <div className="rounded-lg border border-hairline bg-canvas p-xl">
        <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
          Shop Stats
        </p>
        <div className="mt-md grid grid-cols-3 gap-md">
          <div>
            <p className="text-title-lg font-semibold tabular-nums text-ink">
              {statsLoading ? "–" : totalCards}
            </p>
            <p className="mt-xxs text-caption-uppercase uppercase tracking-caption-uppercase text-muted">
              Cards issued
            </p>
          </div>
          <div>
            <p className="text-title-lg font-semibold tabular-nums text-ink">
              {statsLoading ? "–" : totalStampsGiven}
            </p>
            <p className="mt-xxs text-caption-uppercase uppercase tracking-caption-uppercase text-muted">
              Stamps given
            </p>
          </div>
          <div>
            <p className="text-title-lg font-semibold tabular-nums text-ink">
              {statsLoading ? "–" : totalRedemptions}
            </p>
            <p className="mt-xxs text-caption-uppercase uppercase tracking-caption-uppercase text-muted">
              Redemptions
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-hairline bg-canvas p-xl">
        <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
          Shop Setup
        </p>
        <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
          Configure your shop
        </h1>
        <p className="mt-xs text-body-sm text-muted">
          Changes apply immediately to the customer card. New customer cards use the stamps
          count below — cards already in progress keep their original count.
        </p>

        <form onSubmit={handleSubmit} className="mt-lg space-y-md">
          <label className="block">
            <span className="text-title-sm font-semibold text-ink">Shop name</span>
            <input
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
              className="mt-xxs h-11 w-full rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
            />
          </label>

          <label className="block">
            <span className="text-title-sm font-semibold text-ink">Stamps required</span>
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
            <span className="text-title-sm font-semibold text-ink">New staff PIN</span>
            <input
              value={staffPin}
              onChange={(event) => setStaffPin(event.target.value)}
              inputMode="numeric"
              placeholder="Leave blank to keep the current PIN"
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
              Saved.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-md bg-primary text-button font-semibold text-on-primary disabled:opacity-60"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}

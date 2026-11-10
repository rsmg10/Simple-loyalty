"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "./I18nProvider";

type StaffPinGateProps = {
  onUnlock: () => void;
};

export default function StaffPinGate({ onUnlock }: StaffPinGateProps) {
  const { t } = useI18n();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/staff/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        onUnlock();
      } else if (res.status === 429) {
        setError(t.staff.tooManyAttempts);
        setPin("");
      } else {
        setError(t.staff.incorrectPin);
        setPin("");
      }
    } catch {
      setError(t.staff.incorrectPin);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-xl">
      <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
        {t.staff.pinEyebrow}
      </p>
      <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
        {t.staff.pinTitle}
      </h1>

      <form onSubmit={handleSubmit} className="mt-lg">
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          className="h-11 w-full rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
          placeholder={t.staff.pinPlaceholder}
          aria-label={t.staff.pinPlaceholder}
        />
        {error && (
          <p className="mt-xs text-body-sm text-error" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="mt-lg h-11 w-full rounded-md bg-primary text-button font-semibold text-on-primary disabled:opacity-60"
        >
          {t.staff.unlock}
        </button>
      </form>
    </div>
  );
}

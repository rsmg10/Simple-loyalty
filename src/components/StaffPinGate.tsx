"use client";

import { useState, type FormEvent } from "react";

type StaffPinGateProps = {
  onUnlock: () => void;
};

export default function StaffPinGate({ onUnlock }: StaffPinGateProps) {
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
        setError("Too many incorrect attempts. Try again in a few minutes.");
        setPin("");
      } else {
        setError("Incorrect PIN. Try again.");
        setPin("");
      }
    } catch {
      setError("Incorrect PIN. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-xl">
      <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
        Staff Access
      </p>
      <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
        Enter shop PIN
      </h1>

      <form onSubmit={handleSubmit} className="mt-lg">
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          className="h-11 w-full rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
          placeholder="PIN"
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
          Unlock
        </button>
      </form>
    </div>
  );
}

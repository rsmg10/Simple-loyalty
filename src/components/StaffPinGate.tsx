"use client";

import { useState, type FormEvent } from "react";

// Placeholder shared shop PIN for this local prototype.
// Will move to real config once the backend is wired up.
const STAFF_PIN = "1234";

type StaffPinGateProps = {
  onUnlock: () => void;
};

export default function StaffPinGate({ onUnlock }: StaffPinGateProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pin === STAFF_PIN) {
      setError(false);
      onUnlock();
    } else {
      setError(true);
      setPin("");
    }
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-xl">
      <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted-soft">
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
          className="h-11 w-full rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink"
          placeholder="PIN"
        />
        {error && (
          <p className="mt-xs text-body-sm text-error">Incorrect PIN. Try again.</p>
        )}
        <button
          type="submit"
          className="mt-lg h-11 w-full rounded-md bg-primary text-button font-semibold text-on-primary"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}

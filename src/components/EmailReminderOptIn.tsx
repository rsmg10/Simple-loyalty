"use client";

import { useState, type FormEvent } from "react";
import { setCardEmail } from "@/lib/card-store";

type EmailReminderOptInProps = {
  cardId: string;
  email?: string;
};

export default function EmailReminderOptIn({ cardId, email }: EmailReminderOptInProps) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    setCardEmail(cardId, value.trim());
    setSaved(true);
  }

  const confirmedEmail = email ?? (saved ? value : null);

  if (confirmedEmail) {
    return (
      <p className="text-body-sm text-muted">
        📧 We&apos;ll email <span className="text-ink">{confirmedEmail}</span> when you&apos;re 1
        stamp away.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-xs">
      <input
        type="email"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Email for a nudge (optional)"
        className="h-11 flex-1 rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink"
      />
      <button
        type="submit"
        className="h-11 rounded-md border border-hairline px-md text-button font-semibold text-ink"
      >
        Save
      </button>
    </form>
  );
}

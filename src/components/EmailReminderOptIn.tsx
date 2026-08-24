"use client";

import { useState, type FormEvent } from "react";
import { setCardEmail } from "@/lib/card-store";

type EmailReminderOptInProps = {
  cardId: string;
  email?: string;
};

export default function EmailReminderOptIn({ cardId, email }: EmailReminderOptInProps) {
  const [value, setValue] = useState(email ?? "");
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    setSubmitting(true);
    const updated = await setCardEmail(cardId, value.trim());
    setSubmitting(false);
    if (updated) {
      setSaved(true);
      setEditing(false);
    }
  }

  const confirmedEmail = email ?? (saved ? value : null);

  if (confirmedEmail && !editing) {
    return (
      <p className="text-body-sm text-muted">
        📧 We&apos;ll email <span className="text-ink">{confirmedEmail}</span> when you&apos;re 1
        stamp away.{" "}
        <button
          type="button"
          onClick={() => {
            setValue(confirmedEmail);
            setEditing(true);
          }}
          className="font-semibold text-ink underline underline-offset-2"
        >
          Change
        </button>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-xs">
      <input
        type="email"
        value={value}
        autoFocus={editing}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Email for a nudge (optional)"
        className="h-11 flex-1 rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
      />
      <button
        type="submit"
        disabled={submitting}
        className="h-11 rounded-md border border-hairline px-md text-button font-semibold text-ink disabled:opacity-60"
      >
        Save
      </button>
    </form>
  );
}

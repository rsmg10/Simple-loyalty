"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "./I18nProvider";
import { removeCardEmail, setCardEmail } from "@/lib/card-store";

type EmailReminderOptInProps = {
  cardId: string;
  // Masked by the server (see toCardJson) — the full address never comes back.
  emailHint?: string;
};

export default function EmailReminderOptIn({ cardId, emailHint }: EmailReminderOptInProps) {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  // undefined: follow the card as polled; null: just removed; string: just saved.
  const [localHint, setLocalHint] = useState<string | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    setSubmitting(true);
    const updated = await setCardEmail(cardId, value.trim());
    setSubmitting(false);
    if (updated) {
      setLocalHint(updated.emailHint ?? null);
      setEditing(false);
      setValue("");
    }
  }

  async function handleRemove() {
    setSubmitting(true);
    if (await removeCardEmail(cardId)) setLocalHint(null);
    setSubmitting(false);
  }

  const confirmedHint = localHint === undefined ? emailHint : localHint;

  if (confirmedHint && !editing) {
    return (
      <p className="text-body-sm text-muted">
        {t.email.savedPrefix}{" "}
        <bdi dir="ltr" className="text-ink">
          {confirmedHint}
        </bdi>{" "}
        {t.email.savedSuffix}{" "}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="font-semibold text-ink underline underline-offset-2"
        >
          {t.email.change}
        </button>{" "}
        <button
          type="button"
          onClick={handleRemove}
          disabled={submitting}
          className="font-semibold text-ink underline underline-offset-2 disabled:opacity-60"
        >
          {t.email.remove}
        </button>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-xs">
      <input
        type="email"
        dir={value ? "ltr" : undefined}
        value={value}
        autoFocus={editing}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t.email.placeholder}
        aria-label={t.email.placeholder}
        className="h-11 min-w-0 flex-1 rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
      />
      <button
        type="submit"
        disabled={submitting}
        className="h-11 rounded-md border border-hairline px-md text-button font-semibold text-ink disabled:opacity-60"
      >
        {t.email.save}
      </button>
    </form>
  );
}

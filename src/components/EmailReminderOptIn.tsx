"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "./I18nProvider";
import { setCardEmail } from "@/lib/card-store";

type EmailReminderOptInProps = {
  cardId: string;
  email?: string;
};

export default function EmailReminderOptIn({ cardId, email }: EmailReminderOptInProps) {
  const { t } = useI18n();
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
        {t.email.savedPrefix}{" "}
        <bdi dir="ltr" className="text-ink">
          {confirmedEmail}
        </bdi>{" "}
        {t.email.savedSuffix}{" "}
        <button
          type="button"
          onClick={() => {
            setValue(confirmedEmail);
            setEditing(true);
          }}
          className="font-semibold text-ink underline underline-offset-2"
        >
          {t.email.change}
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

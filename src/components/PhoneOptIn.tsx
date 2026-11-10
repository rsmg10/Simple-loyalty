"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "./I18nProvider";
import { setCardPhone } from "@/lib/card-store";

type PhoneOptInProps = {
  cardId: string;
  phoneHint?: string;
};

export default function PhoneOptIn({ cardId, phoneHint }: PhoneOptInProps) {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  const [savedHint, setSavedHint] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await setCardPhone(cardId, value.trim());
    setSubmitting(false);
    if (result.ok) {
      setSavedHint(result.card.phoneHint ?? null);
      setEditing(false);
      setValue("");
    } else {
      setError(t.phone[result.reason]);
    }
  }

  const confirmedHint = savedHint ?? phoneHint;

  if (confirmedHint && !editing) {
    return (
      <p className="text-body-sm text-muted">
        {t.phone.savedPrefix}{" "}
        <bdi dir="ltr" className="text-ink">
          {confirmedHint}
        </bdi>
        .{" "}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="font-semibold text-ink underline underline-offset-2"
        >
          {t.phone.change}
        </button>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-xs">
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          // Typed numbers read left-to-right; the empty field keeps the page
          // direction so an Arabic placeholder sits on the correct side.
          dir={value ? "ltr" : undefined}
          value={value}
          autoFocus={editing}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t.phone.placeholder}
          aria-label={t.phone.placeholder}
          className="h-11 min-w-0 flex-1 rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
        />
        <button
          type="submit"
          disabled={submitting}
          className="h-11 rounded-md border border-hairline px-md text-button font-semibold text-ink disabled:opacity-60"
        >
          {t.phone.save}
        </button>
      </div>
      {error ? (
        <p className="mt-xxs text-body-sm text-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="mt-xxs text-caption text-muted">{t.phone.hint}</p>
      )}
    </form>
  );
}

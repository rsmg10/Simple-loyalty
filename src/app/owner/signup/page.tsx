"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useI18n } from "@/components/I18nProvider";
import LanguageToggle from "@/components/LanguageToggle";
import { postAuthRedirectPath } from "@/lib/owner-auth-config";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function OwnerSignupPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const { data, error } = await getSupabaseBrowserClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/owner/login` },
    });

    setSubmitting(false);

    if (error) {
      // Supabase's messages are English-only.
      setError(t.ownerAuth.signUpFailed);
      return;
    }

    // With email confirmation on (the Supabase default), signUp() doesn't
    // return a session yet — the account exists but can't sign in until the
    // confirmation link is clicked.
    if (data.session) {
      router.push(postAuthRedirectPath());
      router.refresh();
    } else {
      setAwaitingConfirmation(true);
    }
  }

  if (awaitingConfirmation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas p-lg py-xxl">
        <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-xl text-center">
          <h1 className="text-display-sm font-medium tracking-display-sm text-ink">{t.ownerAuth.checkEmailTitle}</h1>
          <p className="mt-sm text-body-sm text-muted">
            {t.ownerAuth.checkEmailBody}{" "}
            <bdi dir="ltr" className="text-ink">
              {email}
            </bdi>
            . {t.ownerAuth.checkEmailThen}{" "}
            <Link href="/owner/login" className="font-semibold text-ink underline underline-offset-2">
              {t.ownerAuth.signInLink}
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-md bg-canvas p-lg py-xxl">
      <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-xl">
        <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
          {t.ownerAuth.eyebrow}
        </p>
        <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">{t.ownerAuth.signUpTitle}</h1>

        <form onSubmit={handleSubmit} className="mt-lg flex flex-col gap-sm">
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            dir={email ? "ltr" : undefined}
            placeholder={t.ownerAuth.email}
            aria-label={t.ownerAuth.email}
            className="h-11 w-full rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t.ownerAuth.passwordNew}
            aria-label={t.ownerAuth.passwordNew}
            className="h-11 w-full rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
          />
          {error && (
            <p className="text-body-sm text-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-md bg-primary text-button font-semibold text-on-primary disabled:opacity-60"
          >
            {t.ownerAuth.signUp}
          </button>
        </form>

        <p className="mt-md text-center text-body-sm text-muted">
          {t.ownerAuth.haveAccount}{" "}
          <Link href="/owner/login" className="font-semibold text-ink underline underline-offset-2">
            {t.ownerAuth.signIn}
          </Link>
        </p>
      </div>
      <LanguageToggle />
    </main>
  );
}

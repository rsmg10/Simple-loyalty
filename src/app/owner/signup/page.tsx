"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function OwnerSignupPage() {
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
      setError(error.message);
      return;
    }

    // With email confirmation on (the Supabase default), signUp() doesn't
    // return a session yet — the account exists but can't sign in until the
    // confirmation link is clicked.
    if (data.session) {
      router.push("/setup");
      router.refresh();
    } else {
      setAwaitingConfirmation(true);
    }
  }

  if (awaitingConfirmation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas p-lg py-xxl">
        <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-xl text-center">
          <h1 className="text-display-sm font-medium tracking-display-sm text-ink">Check your email</h1>
          <p className="mt-sm text-body-sm text-muted">
            We sent a confirmation link to <span className="text-ink">{email}</span>. Click it, then{" "}
            <Link href="/owner/login" className="font-semibold text-ink underline underline-offset-2">
              sign in
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-lg py-xxl">
      <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-xl">
        <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
          Owner Access
        </p>
        <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">Create an account</h1>

        <form onSubmit={handleSubmit} className="mt-lg flex flex-col gap-sm">
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="h-11 w-full rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (min. 8 characters)"
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
            Sign up
          </button>
        </form>

        <p className="mt-md text-center text-body-sm text-muted">
          Already have an account?{" "}
          <Link href="/owner/login" className="font-semibold text-ink underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

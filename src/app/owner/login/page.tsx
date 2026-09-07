"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({ email, password });

    if (error) {
      setSubmitting(false);
      setError("Incorrect email or password.");
      return;
    }

    router.push("/setup");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-lg py-xxl">
      <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-xl">
        <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
          Owner Access
        </p>
        <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">Sign in</h1>

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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
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
            Sign in
          </button>
        </form>

        <p className="mt-md text-center text-body-sm text-muted">
          No account?{" "}
          <Link href="/owner/signup" className="font-semibold text-ink underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { slugify } from "@/lib/tenant";

export default function CreateShopForm() {
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [staffPin, setStaffPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleShopNameChange(value: string) {
    setShopName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopName, slug, staffPin }),
    });
    const data = await res.json();

    if (!res.ok) {
      setSubmitting(false);
      setError(data.error ?? "Something went wrong.");
      return;
    }

    // A real cross-subdomain navigation, not router.push — the new shop
    // lives on a different host.
    window.location.href = data.redirectUrl;
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-xl">
      <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
        Set Up Your Shop
      </p>
      <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">Create your shop</h1>

      <form onSubmit={handleSubmit} className="mt-lg flex flex-col gap-sm">
        <input
          type="text"
          required
          autoFocus
          value={shopName}
          onChange={(event) => handleShopNameChange(event.target.value)}
          placeholder="Shop name"
          className="h-11 w-full rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
        />
        <div>
          <input
            type="text"
            required
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value.toLowerCase());
            }}
            placeholder="subdomain"
            className="h-11 w-full rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
          />
          {slug && (
            <p className="mt-xxs text-body-sm text-muted">
              {slug}.{process.env.NEXT_PUBLIC_APP_ROOT_DOMAIN}
            </p>
          )}
        </div>
        <input
          type="password"
          required
          inputMode="numeric"
          value={staffPin}
          onChange={(event) => setStaffPin(event.target.value)}
          placeholder="Staff PIN (min. 4 characters)"
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
          Create shop
        </button>
      </form>
    </div>
  );
}

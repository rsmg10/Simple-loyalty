"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Status = "pending" | "done" | "error";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const cardId = searchParams.get("card");
  const [status, setStatus] = useState<Status>("pending");

  useEffect(() => {
    if (!cardId) {
      setStatus("error");
      return;
    }

    fetch(`/api/cards/${cardId}/unsubscribe`, { method: "POST" })
      .then((res) => setStatus(res.ok ? "done" : "error"))
      .catch(() => setStatus("error"));
  }, [cardId]);

  return (
    <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-xl text-center">
      {status === "pending" && <p className="text-body-md text-muted">Unsubscribing…</p>}
      {status === "done" && (
        <>
          <h1 className="text-display-sm font-medium tracking-display-sm text-ink">
            You&apos;re unsubscribed
          </h1>
          <p className="mt-xs text-body-sm text-muted">
            We won&apos;t email you any more stamp reminders. Your card still works as normal.
          </p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-display-sm font-medium tracking-display-sm text-ink">
            Couldn&apos;t unsubscribe
          </h1>
          <p className="mt-xs text-body-sm text-muted">
            That link looks invalid or expired. You can also stop reminders any time from your
            stamp card page.
          </p>
        </>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-lg py-xxl">
      <Suspense fallback={<p className="text-body-sm text-muted">Loading…</p>}>
        <UnsubscribeContent />
      </Suspense>
    </main>
  );
}

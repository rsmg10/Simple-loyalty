"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type Status = "pending" | "done" | "error";

function UnsubscribeContent() {
  const { t } = useI18n();
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
      {status === "pending" && <p className="text-body-md text-muted">{t.unsubscribe.pending}</p>}
      {status === "done" && (
        <>
          <h1 className="text-display-sm font-medium tracking-display-sm text-ink">
            {t.unsubscribe.doneTitle}
          </h1>
          <p className="mt-xs text-body-sm text-muted">{t.unsubscribe.doneBody}</p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-display-sm font-medium tracking-display-sm text-ink">
            {t.unsubscribe.errorTitle}
          </h1>
          <p className="mt-xs text-body-sm text-muted">{t.unsubscribe.errorBody}</p>
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

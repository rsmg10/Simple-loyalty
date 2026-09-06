"use client";

import { useState } from "react";

type WalletButtonsProps = {
  cardId: string;
  appleWalletEnabled: boolean;
  googleWalletEnabled: boolean;
};

export default function WalletButtons({
  cardId,
  appleWalletEnabled,
  googleWalletEnabled,
}: WalletButtonsProps) {
  const [googleError, setGoogleError] = useState(false);
  const [addingToGoogle, setAddingToGoogle] = useState(false);

  if (!appleWalletEnabled && !googleWalletEnabled) return null;

  async function handleAddToGoogleWallet() {
    setGoogleError(false);
    setAddingToGoogle(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/google-wallet`);
      if (!res.ok) throw new Error("Failed to get Google Wallet link");
      const { saveUrl } = (await res.json()) as { saveUrl: string };
      window.location.href = saveUrl;
    } catch {
      setGoogleError(true);
    } finally {
      setAddingToGoogle(false);
    }
  }

  return (
    <div className="flex flex-col gap-xs">
      {appleWalletEnabled && (
        <a
          href={`/api/cards/${cardId}/apple-wallet`}
          className="flex h-11 items-center justify-center rounded-md border border-hairline text-button font-semibold text-ink"
        >
          Add to Apple Wallet
        </a>
      )}
      {googleWalletEnabled && (
        <>
          <button
            type="button"
            onClick={handleAddToGoogleWallet}
            disabled={addingToGoogle}
            className="flex h-11 items-center justify-center rounded-md border border-hairline text-button font-semibold text-ink disabled:opacity-60"
          >
            Add to Google Wallet
          </button>
          {googleError && (
            <p className="text-center text-body-sm text-muted">
              Couldn&apos;t add to Google Wallet. Try again.
            </p>
          )}
        </>
      )}
    </div>
  );
}

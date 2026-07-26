"use client";

import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Confetti from "./Confetti";
import { addStamp, getCard, type CardRecord } from "@/lib/card-store";

type ScanState =
  | { status: "scanning" }
  | { status: "not-found" }
  | { status: "confirm"; cardId: string; card: CardRecord }
  | { status: "success"; card: CardRecord; redeemed: boolean };

export default function StampScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>();

  const [state, setState] = useState<ScanState>({ status: "scanning" });
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraDisabled, setCameraDisabled] = useState(false);

  const lookUpCard = useCallback((cardId: string) => {
    const card = getCard(cardId);
    if (!card) {
      setState({ status: "not-found" });
      return;
    }
    setState({ status: "confirm", cardId, card });
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height);
        if (result?.data) {
          lookUpCard(result.data);
          return;
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [lookUpCard]);

  useEffect(() => {
    if (state.status !== "scanning" || cameraDisabled) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    let cancelled = false;

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        setCameraError("Camera unavailable — use manual entry below.");
        setCameraDisabled(true);
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state.status, cameraDisabled, tick]);

  function handleConfirm() {
    if (state.status !== "confirm") return;
    const previousRedemptions = state.card.redemptions;
    const updated = addStamp(state.cardId);
    setState({
      status: "success",
      card: updated,
      redeemed: updated.redemptions > previousRedemptions,
    });
  }

  function handleManualSubmit(event: FormEvent) {
    event.preventDefault();
    if (manualCode.trim()) {
      lookUpCard(manualCode.trim());
      setManualCode("");
    }
  }

  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-lg border border-hairline bg-canvas p-xl">
      {state.status === "success" && state.redeemed && <Confetti />}

      <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
        Staff Scan
      </p>

      {state.status === "scanning" && (
        <>
          <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
            Scan customer card
          </h1>

          {!cameraDisabled && (
            <div className="mt-lg overflow-hidden rounded-md border border-hairline bg-surface-dark">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                ref={videoRef}
                className="aspect-square w-full object-cover"
                muted
                playsInline
              />
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />

          {cameraError && (
            <p className="mt-xs text-body-sm text-error" role="alert">
              {cameraError}
            </p>
          )}

          <form onSubmit={handleManualSubmit} className={cameraDisabled ? "" : "mt-lg"}>
            <p className="text-body-sm text-muted">Or enter the card code manually</p>
            <div className="mt-xs flex gap-xs">
              <input
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                className="h-11 flex-1 rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
                placeholder="Card code"
              />
              <button
                type="submit"
                className="h-11 rounded-md border border-hairline px-md text-button font-semibold text-ink"
              >
                Look up
              </button>
            </div>
          </form>
        </>
      )}

      {state.status === "not-found" && (
        <>
          <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
            Card not found
          </h1>
          <p className="mt-xs text-body-sm text-muted" role="alert">
            That code doesn&apos;t match a card. Ask the customer to reopen their card and try
            again.
          </p>
          <button
            onClick={() => setState({ status: "scanning" })}
            className="mt-lg h-11 w-full rounded-md bg-primary text-button font-semibold text-on-primary"
          >
            Try again
          </button>
        </>
      )}

      {state.status === "confirm" && (
        <>
          <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
            Add a stamp?
          </h1>
          <p className="mt-xs font-mono text-title-lg font-semibold tabular-nums text-ink">
            {state.card.stampsEarned} / {state.card.stampsRequired}
          </p>
          <div className="mt-lg flex gap-sm">
            <button
              onClick={() => setState({ status: "scanning" })}
              className="h-11 flex-1 rounded-md border border-hairline text-button font-semibold text-ink"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="h-11 flex-1 rounded-md bg-primary text-button font-semibold text-on-primary"
            >
              Add stamp
            </button>
          </div>
        </>
      )}

      {state.status === "success" && (
        <>
          <div
            className={`animate-stamp-enter mt-xxs flex h-11 w-11 items-center justify-center rounded-full ${
              state.redeemed ? "bg-brand-ochre" : "bg-primary"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4 10.5L8 14.5L16 5.5"
                stroke={state.redeemed ? "#0a0a0a" : "#fffaf0"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="mt-sm text-display-sm font-medium tracking-display-sm text-ink">
            {state.redeemed ? "Free coffee redeemed!" : "Stamp added"}
          </h1>
          {state.redeemed && (
            <p className="mt-xxs text-title-sm font-semibold text-ink">
              🎁 Give them a free coffee!
            </p>
          )}
          <p className="mt-xs font-mono text-title-lg font-semibold tabular-nums text-ink">
            {state.card.stampsEarned} / {state.card.stampsRequired}
          </p>
          <button
            onClick={() => setState({ status: "scanning" })}
            className="mt-lg h-11 w-full rounded-md bg-primary text-button font-semibold text-on-primary"
          >
            Scan next customer
          </button>
        </>
      )}
    </div>
  );
}

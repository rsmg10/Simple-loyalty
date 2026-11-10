"use client";

import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import CardQRCode from "./CardQRCode";
import Confetti from "./Confetti";
import { useI18n } from "./I18nProvider";
import { MAX_STAMPS_PER_PURCHASE } from "@/lib/card-json";
import {
  SHARED_CARD_PARAM,
  addStamps,
  getCard,
  isCardId,
  lookupCardByPhone,
  type CardRecord,
} from "@/lib/card-store";

type ScanState =
  | { status: "scanning" }
  | { status: "not-found" }
  // `manual` = found from a typed number/code, i.e. the customer probably
  // doesn't have the card on the phone in front of them — offer to move it.
  // `count` = stamps for this purchase (several coffees, one scan).
  | { status: "confirm"; cardId: string; card: CardRecord; manual: boolean; count: number }
  | { status: "success"; card: CardRecord; added: number; rewards: number };

export default function StampScanner() {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>();

  const [state, setState] = useState<ScanState>({ status: "scanning" });
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraDisabled, setCameraDisabled] = useState(false);
  const [showMoveCard, setShowMoveCard] = useState(false);

  const lookUpCard = useCallback(async (cardId: string, manual: boolean) => {
    const card = isCardId(cardId) ? await getCard(cardId) : null;
    if (!card) {
      setState({ status: "not-found" });
      return;
    }
    setState({ status: "confirm", cardId, card, manual, count: 1 });
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
          lookUpCard(result.data, false);
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
        setCameraError(t.staff.cameraUnavailable);
        setCameraDisabled(true);
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // t only feeds the error message — a language switch shouldn't restart the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, cameraDisabled, tick]);

  async function handleConfirm() {
    if (state.status !== "confirm") return;
    const previousRedemptions = state.card.redemptions;
    const updated = await addStamps(state.cardId, state.count);
    if (!updated) {
      // Most likely the staff session expired — send them back through the PIN gate.
      window.location.reload();
      return;
    }
    setState({
      status: "success",
      card: updated,
      added: state.count,
      rewards: updated.redemptions - previousRedemptions,
    });
  }

  function changeCount(delta: number) {
    setState((current) =>
      current.status === "confirm"
        ? { ...current, count: Math.min(MAX_STAMPS_PER_PURCHASE, Math.max(1, current.count + delta)) }
        : current,
    );
  }

  async function handleManualSubmit(event: FormEvent) {
    event.preventDefault();
    const value = manualCode.trim();
    if (!value) return;
    setManualCode("");

    if (isCardId(value)) {
      lookUpCard(value, true);
      return;
    }

    const { card, status } = await lookupCardByPhone(value);
    if (status === 401) {
      // Staff session expired — back through the PIN gate.
      window.location.reload();
      return;
    }
    if (!card) {
      setState({ status: "not-found" });
      return;
    }
    setState({ status: "confirm", cardId: card.id, card, manual: true, count: 1 });
  }

  function scanNext() {
    setShowMoveCard(false);
    setState({ status: "scanning" });
  }

  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-lg border border-hairline bg-canvas p-xl">
      {state.status === "success" && state.rewards > 0 && <Confetti />}

      <p className="text-caption-uppercase font-semibold uppercase tracking-caption-uppercase text-muted">
        {t.staff.scanEyebrow}
      </p>

      {state.status === "scanning" && (
        <>
          <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
            {t.staff.scanTitle}
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
            <p className="text-body-sm text-muted">{t.staff.manualPrompt}</p>
            <div className="mt-xs flex gap-xs">
              <input
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                dir={manualCode ? "ltr" : undefined}
                inputMode="tel"
                autoComplete="off"
                aria-label={t.staff.manualPlaceholder}
                className="h-11 min-w-0 flex-1 rounded-md border border-hairline bg-canvas px-md text-body-md text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-canvas"
                placeholder={t.staff.manualPlaceholder}
              />
              <button
                type="submit"
                className="h-11 rounded-md border border-hairline px-md text-button font-semibold text-ink"
              >
                {t.staff.lookUp}
              </button>
            </div>
          </form>
        </>
      )}

      {state.status === "not-found" && (
        <>
          <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
            {t.staff.notFoundTitle}
          </h1>
          <p className="mt-xs text-body-sm text-muted" role="alert">
            {t.staff.notFoundBody}
          </p>
          <button
            onClick={scanNext}
            className="mt-lg h-11 w-full rounded-md bg-primary text-button font-semibold text-on-primary"
          >
            {t.staff.tryAgain}
          </button>
        </>
      )}

      {state.status === "confirm" && (
        <>
          <h1 className="mt-xxs text-display-sm font-medium tracking-display-sm text-ink">
            {t.staff.confirmTitle}
          </h1>
          <p className="mt-xs font-mono text-title-lg font-semibold tabular-nums text-ink">
            <span dir="ltr">
              {state.card.stampsEarned} / {state.card.stampsRequired}
            </span>
          </p>
          {state.card.phoneHint && (
            <p className="mt-xxs text-body-sm text-muted">
              📱 <bdi dir="ltr">{state.card.phoneHint}</bdi>
            </p>
          )}
          <div className="mt-md flex items-center justify-between gap-sm rounded-md border border-hairline p-xs">
            <span className="ps-xs text-body-sm text-muted">{t.staff.stampCount}</span>
            <div className="flex items-center gap-xs">
              <button
                type="button"
                onClick={() => changeCount(-1)}
                disabled={state.count <= 1}
                aria-label={t.staff.fewerStamps}
                className="h-11 w-11 rounded-md border border-hairline text-title-md font-semibold text-ink disabled:opacity-40"
              >
                −
              </button>
              <span className="w-8 text-center font-mono text-title-lg font-semibold tabular-nums text-ink" aria-live="polite">
                {state.count}
              </span>
              <button
                type="button"
                onClick={() => changeCount(1)}
                disabled={state.count >= MAX_STAMPS_PER_PURCHASE}
                aria-label={t.staff.moreStamps}
                className="h-11 w-11 rounded-md border border-hairline text-title-md font-semibold text-ink disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
          <div className="mt-md flex gap-sm">
            <button
              onClick={scanNext}
              className="h-11 flex-1 rounded-md border border-hairline text-button font-semibold text-ink"
            >
              {t.staff.cancel}
            </button>
            <button
              onClick={handleConfirm}
              className="h-11 flex-1 rounded-md bg-primary text-button font-semibold text-on-primary"
            >
              {t.staff.addStamps(state.count)}
            </button>
          </div>
          {state.manual && <MoveCard cardId={state.cardId} open={showMoveCard} onToggle={setShowMoveCard} />}
        </>
      )}

      {state.status === "success" && (
        <>
          <div
            className={`animate-stamp-enter mt-xxs flex h-11 w-11 items-center justify-center rounded-full ${
              state.rewards > 0 ? "bg-brand-ochre" : "bg-primary"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4 10.5L8 14.5L16 5.5"
                stroke={state.rewards > 0 ? "#0a0a0a" : "#fffaf0"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="mt-sm text-display-sm font-medium tracking-display-sm text-ink">
            {state.rewards > 0 ? t.staff.rewardRedeemed : t.staff.stampsAdded(state.added)}
          </h1>
          {state.rewards > 0 && (
            <p className="mt-xxs text-title-sm font-semibold text-ink">
              {t.staff.giveRewards(state.rewards)}
            </p>
          )}
          <p className="mt-xs font-mono text-title-lg font-semibold tabular-nums text-ink">
            <span dir="ltr">
              {state.card.stampsEarned} / {state.card.stampsRequired}
            </span>
          </p>
          <button
            onClick={scanNext}
            className="mt-lg h-11 w-full rounded-md bg-primary text-button font-semibold text-on-primary"
          >
            {t.staff.scanNext}
          </button>
        </>
      )}
    </div>
  );
}

// A QR of this shop's card page with the card id attached — scanned with
// the customer's phone camera, it puts this card on that phone (see
// useOwnCard). Staff are the check here: they can see who's at the counter.
function MoveCard({
  cardId,
  open,
  onToggle,
}: {
  cardId: string;
  open: boolean;
  onToggle: (open: boolean) => void;
}) {
  const { t } = useI18n();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onToggle(true)}
        className="mt-md w-full text-body-sm text-muted underline underline-offset-2"
      >
        {t.staff.moveCard}
      </button>
    );
  }

  const url = new URL("/", window.location.origin);
  url.searchParams.set(SHARED_CARD_PARAM, cardId);

  return (
    <div className="mt-md border-t border-hairline pt-md text-center">
      <p className="text-body-sm text-muted">{t.staff.moveCardHint}</p>
      <div className="mt-xs">
        <CardQRCode value={url.toString()} label={t.staff.moveCard} />
      </div>
      <button
        type="button"
        onClick={() => onToggle(false)}
        className="mt-xs text-body-sm text-muted underline underline-offset-2"
      >
        {t.staff.moveCardDone}
      </button>
    </div>
  );
}

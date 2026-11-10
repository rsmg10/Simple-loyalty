"use client";

import { useEffect, useState } from "react";
import { useI18n } from "./I18nProvider";
import { detectInstallMode, type InstallMode } from "@/lib/install-prompt";

const DISMISSED_KEY = "home_screen_prompt_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Chrome fires `beforeinstallprompt` once, early — often before the card has
// loaded and this component mounts — so it's captured at module load.
let nativePrompt: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach((subscriber) => subscriber());

// localStorage can throw (private mode, blocked storage) — a prompt that
// can't remember being dismissed just shows again, nothing worse.
function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // see readDismissed
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // our own prompt replaces Chrome's mini-infobar
    nativePrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    nativePrompt = null;
    markDismissed();
    notify();
  });
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// Points the page's manifest at this card, so a home-screen icon opens this
// card rather than a blank one (see buildWebManifest for why).
function useCardManifest(cardId: string) {
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    link.href = `/manifest.webmanifest?card=${cardId}`;
  }, [cardId]);
}

type HomeScreenPromptProps = {
  cardId: string;
  // Shown once the customer has a stamp — they've committed, and they're
  // still at the counter, which is the moment to make the card easy to find.
  eligible: boolean;
};

export default function HomeScreenPrompt({ cardId, eligible }: HomeScreenPromptProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<InstallMode | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useCardManifest(cardId);

  useEffect(() => {
    const update = () => {
      setDismissed(readDismissed());
      setMode(
        detectInstallMode({
          userAgent: navigator.userAgent,
          standalone: isStandalone(),
          hasNativePrompt: nativePrompt !== null,
          maxTouchPoints: navigator.maxTouchPoints,
        }),
      );
    };
    update();
    subscribers.add(update);
    return () => {
      subscribers.delete(update);
    };
  }, []);

  if (!eligible || dismissed || !mode) return null;

  function dismiss() {
    markDismissed();
    setDismissed(true);
  }

  async function install() {
    const prompt = nativePrompt;
    if (!prompt) return;
    nativePrompt = null; // single use
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") dismiss();
    else notify(); // falls back to the menu instructions
  }

  const body = {
    native: t.install.native,
    ios: t.install.ios,
    "android-manual": t.install.androidManual,
    "in-app": t.install.inApp,
  }[mode];

  return (
    <div className="mt-md flex items-start gap-sm rounded-md bg-canvas p-sm" role="region" aria-label={t.install.title}>
      <span aria-hidden="true" className="text-title-md leading-none">
        📲
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-semibold text-ink">{t.install.title}</p>
        <p className="mt-xxs text-body-sm text-muted">{body}</p>
        {mode === "native" && (
          <button
            type="button"
            onClick={install}
            className="mt-xs h-9 rounded-md bg-primary px-md text-button font-semibold text-on-primary"
          >
            {t.install.add}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t.install.dismiss}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted"
      >
        ✕
      </button>
    </div>
  );
}

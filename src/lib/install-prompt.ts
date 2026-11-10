// Which "save to home screen" help a browser gets:
// - native: Chrome on Android fired `beforeinstallprompt` — one-tap "Add"
// - ios: Safari has no install API — explain the Share menu
// - android-manual: Android without the event (other browsers, or Chrome
//   not offering it yet) — explain the browser menu
// - in-app: Facebook/Instagram/Messenger's built-in browser can't install
//   at all — send them to a real browser
// - null: already installed, or not a phone
export type InstallMode = "native" | "ios" | "android-manual" | "in-app";

const IN_APP_BROWSER = /FBAN|FBAV|FB_IAB|Instagram|Messenger/i;

export function detectInstallMode(env: {
  userAgent: string;
  standalone: boolean;
  hasNativePrompt: boolean;
  maxTouchPoints: number;
}): InstallMode | null {
  if (env.standalone) return null;
  if (IN_APP_BROWSER.test(env.userAgent)) return "in-app";
  if (env.hasNativePrompt) return "native";
  // iPadOS reports a Mac user agent; touch support gives it away.
  const isIos = /iPhone|iPad|iPod/.test(env.userAgent) || (/Macintosh/.test(env.userAgent) && env.maxTouchPoints > 1);
  if (isIos) return "ios";
  if (/Android/.test(env.userAgent)) return "android-manual";
  return null;
}

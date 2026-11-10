import { describe, expect, it } from "vitest";
import { detectInstallMode } from "./install-prompt";

const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const IPAD_DESKTOP_MODE =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15";
const FACEBOOK_ANDROID = `${ANDROID_CHROME} [FB_IAB/FB4A;FBAV/480.0.0.0;]`;
const DESKTOP_CHROME =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const env = (userAgent: string, overrides: Partial<Parameters<typeof detectInstallMode>[0]> = {}) => ({
  userAgent,
  standalone: false,
  hasNativePrompt: false,
  maxTouchPoints: 5,
  ...overrides,
});

describe("detectInstallMode", () => {
  it("never prompts inside the installed app", () => {
    expect(detectInstallMode(env(ANDROID_CHROME, { standalone: true, hasNativePrompt: true }))).toBeNull();
  });

  it("uses Chrome's one-tap install when it's offered", () => {
    expect(detectInstallMode(env(ANDROID_CHROME, { hasNativePrompt: true }))).toBe("native");
  });

  it("explains the browser menu on Android without the native prompt", () => {
    expect(detectInstallMode(env(ANDROID_CHROME))).toBe("android-manual");
  });

  it("explains the Share menu on iPhone and on iPad in desktop mode", () => {
    expect(detectInstallMode(env(IPHONE_SAFARI))).toBe("ios");
    expect(detectInstallMode(env(IPAD_DESKTOP_MODE))).toBe("ios");
  });

  it("sends Facebook/Instagram in-app browsers to a real browser, even if they fire the event", () => {
    expect(detectInstallMode(env(FACEBOOK_ANDROID, { hasNativePrompt: true }))).toBe("in-app");
  });

  it("stays quiet on desktop", () => {
    expect(detectInstallMode(env(DESKTOP_CHROME, { maxTouchPoints: 0 }))).toBeNull();
    expect(detectInstallMode(env(IPAD_DESKTOP_MODE, { maxTouchPoints: 0 }))).toBeNull();
  });
});

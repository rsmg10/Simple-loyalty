import { describe, expect, it } from "vitest";
import { CLIENT_LIMITS, NO_ATTEMPTS, afterFailure, clientIp, clientKey, isLocked } from "./login-throttle";

const NOW = new Date("2026-11-25T10:00:00Z");
const minutesLater = (minutes: number) => new Date(NOW.getTime() + minutes * 60 * 1000);

describe("afterFailure / isLocked", () => {
  it("counts wrong PINs without locking below the limit", () => {
    let state = NO_ATTEMPTS;
    for (let i = 0; i < CLIENT_LIMITS.maxFailures - 1; i++) state = afterFailure(state, CLIENT_LIMITS, NOW);
    expect(state.failedAttempts).toBe(CLIENT_LIMITS.maxFailures - 1);
    expect(isLocked(state, NOW)).toBe(false);
  });

  it("locks on reaching the limit, then unlocks with a fresh count once it expires", () => {
    let state = NO_ATTEMPTS;
    for (let i = 0; i < CLIENT_LIMITS.maxFailures; i++) state = afterFailure(state, CLIENT_LIMITS, NOW);
    expect(isLocked(state, NOW)).toBe(true);
    expect(isLocked(state, minutesLater(14))).toBe(true);
    expect(isLocked(state, minutesLater(16))).toBe(false);
    expect(state.failedAttempts).toBe(0);
  });
});

describe("clientIp", () => {
  it("takes the first x-forwarded-for entry (the real client on Vercel)", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "41.208.1.2, 10.0.0.1" }))).toBe("41.208.1.2");
  });

  it("falls back to x-real-ip, then a shared bucket", () => {
    expect(clientIp(new Headers({ "x-real-ip": "41.208.1.3" }))).toBe("41.208.1.3");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("clientKey", () => {
  it("is stable per IP, different across IPs, and doesn't contain the IP", () => {
    const key = clientKey("41.208.1.2", "secret");
    expect(clientKey("41.208.1.2", "secret")).toBe(key);
    expect(clientKey("41.208.1.3", "secret")).not.toBe(key);
    expect(key).not.toContain("41.208");
  });
});

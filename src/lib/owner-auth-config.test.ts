import { afterEach, describe, expect, it } from "vitest";
import { isOwnerAuthConfigured } from "./owner-auth-config";

const REQUIRED_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

afterEach(() => {
  for (const key of REQUIRED_KEYS) delete process.env[key];
});

describe("isOwnerAuthConfigured", () => {
  it("is false when no env vars are set", () => {
    expect(isOwnerAuthConfigured()).toBe(false);
  });

  it("is true once both env vars are set", () => {
    for (const key of REQUIRED_KEYS) process.env[key] = "x";
    expect(isOwnerAuthConfigured()).toBe(true);
  });

  it("is false if only one env var is set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "x";
    expect(isOwnerAuthConfigured()).toBe(false);
  });
});

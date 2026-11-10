import { describe, expect, it } from "vitest";
import { checksum, loadMigrations, planMigrations, shouldSkip } from "./migrate.mjs";

const migration = (name, sql = `-- ${name}`) => ({ name, sql, checksum: checksum(sql) });

describe("planMigrations", () => {
  const all = [migration("0001_a.sql"), migration("0002_b.sql"), migration("0003_c.sql")];

  it("returns everything for a fresh database", () => {
    expect(planMigrations(all, new Map()).map((m) => m.name)).toEqual(["0001_a.sql", "0002_b.sql", "0003_c.sql"]);
  });

  it("returns only what hasn't been applied", () => {
    const applied = new Map([[all[0].name, all[0].checksum]]);
    expect(planMigrations(all, applied).map((m) => m.name)).toEqual(["0002_b.sql", "0003_c.sql"]);
  });

  it("refuses to run when an applied migration was edited", () => {
    const applied = new Map([[all[0].name, checksum("-- the original contents")]]);
    expect(() => planMigrations(all, applied)).toThrow(/0001_a\.sql changed after it was applied/);
  });

  it("refuses to run when an applied migration's file is gone", () => {
    const applied = new Map([["0000_deleted.sql", "x"]]);
    expect(() => planMigrations(all, applied)).toThrow(/0000_deleted\.sql .* file is missing/);
  });
});

describe("shouldSkip", () => {
  it("skips without a database URL", () => {
    expect(shouldSkip({})).toMatch(/DATABASE_URL/);
  });

  it("skips Vercel preview builds but runs production ones", () => {
    expect(shouldSkip({ DATABASE_URL: "postgres://x", VERCEL_ENV: "preview" })).toMatch(/preview/);
    expect(shouldSkip({ DATABASE_URL: "postgres://x", VERCEL_ENV: "production" })).toBeNull();
  });

  it("runs outside Vercel when a database URL is set", () => {
    expect(shouldSkip({ DATABASE_URL: "postgres://x" })).toBeNull();
  });
});

describe("loadMigrations", () => {
  it("loads the repo's migrations in order", async () => {
    const names = (await loadMigrations()).map((m) => m.name);
    expect(names[0]).toBe("0001_initial.sql");
    expect([...names].sort()).toEqual(names);
  });
});

#!/usr/bin/env node
// Applies pending SQL migrations from supabase/migrations to DATABASE_URL.
//
// Runs automatically before every `npm run build` (so each deploy migrates
// its own database first, and a failed migration fails the deploy instead
// of shipping code against an old schema). It's a no-op when DATABASE_URL
// is unset (CI, local builds) and on Vercel preview builds, so an unmerged
// branch can never migrate the production database.
//
// Applied migrations are recorded in `schema_migrations` with a checksum;
// editing a migration after it has been applied is an error — add a new
// one instead. Keep migrations additive (new columns/tables), since the
// previous deployment keeps serving traffic until the new one is live.

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

export const MIGRATIONS_DIR = fileURLToPath(new URL("../supabase/migrations/", import.meta.url));
const MIGRATION_FILE = /^\d{4}_[a-z0-9_]+\.sql$/;
// Arbitrary constant: concurrent builds take turns instead of racing.
const ADVISORY_LOCK_ID = 7340112;

export function checksum(sql) {
  return createHash("sha256").update(sql).digest("hex");
}

export async function loadMigrations(dir = MIGRATIONS_DIR) {
  const names = (await readdir(dir)).filter((name) => MIGRATION_FILE.test(name)).sort();
  return Promise.all(
    names.map(async (name) => {
      const sql = await readFile(path.join(dir, name), "utf8");
      return { name, sql, checksum: checksum(sql) };
    }),
  );
}

// `applied` maps migration name -> checksum recorded when it ran.
export function planMigrations(migrations, applied) {
  const known = new Set(migrations.map((migration) => migration.name));
  for (const name of applied.keys()) {
    if (!known.has(name)) {
      throw new Error(`Migration ${name} was applied to this database but its file is missing.`);
    }
  }
  for (const migration of migrations) {
    const recorded = applied.get(migration.name);
    if (recorded && recorded !== migration.checksum) {
      throw new Error(
        `Migration ${migration.name} changed after it was applied. Revert the edit and add a new migration instead.`,
      );
    }
  }
  return migrations.filter((migration) => !applied.has(migration.name));
}

export function shouldSkip(env) {
  if (!env.DATABASE_URL) return "DATABASE_URL is not set";
  if (env.VERCEL_ENV && env.VERCEL_ENV !== "production") return `this is a Vercel ${env.VERCEL_ENV} build`;
  return null;
}

export async function migrate(databaseUrl, { log = console.log } = {}) {
  const migrations = await loadMigrations();
  // prepare: false — Supabase's pooled connection strings don't support
  // prepared statements.
  const sql = postgres(databaseUrl, { prepare: false, max: 1, onnotice: () => {} });
  try {
    // One transaction for the whole run: either every pending migration
    // applies, or none do.
    return await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(${ADVISORY_LOCK_ID})`;
      await tx`
        create table if not exists schema_migrations (
          name text primary key,
          checksum text not null,
          applied_at timestamptz not null default now()
        )
      `;
      // Same reasoning as migration 0002: keep it away from the anon key.
      await tx`alter table schema_migrations enable row level security`;
      const rows = await tx`select name, checksum from schema_migrations`;
      const pending = planMigrations(migrations, new Map(rows.map((row) => [row.name, row.checksum])));

      for (const migration of pending) {
        await tx.unsafe(migration.sql);
        await tx`insert into schema_migrations (name, checksum) values (${migration.name}, ${migration.checksum})`;
        log(`migrate: applied ${migration.name}`);
      }
      if (pending.length === 0) {
        log("migrate: database is up to date");
      } else {
        // Supabase's REST layer (PostgREST) caches the schema; without a
        // reload, writes to a just-added column fail with PGRST204 until it
        // refreshes on its own. Delivered on commit; harmless if nothing
        // is listening.
        await tx`notify pgrst, 'reload schema'`;
      }
      return pending.map((migration) => migration.name);
    });
  } finally {
    await sql.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const skipReason = shouldSkip(process.env);
  if (skipReason) {
    console.log(`migrate: skipped (${skipReason})`);
  } else {
    migrate(process.env.DATABASE_URL).catch((error) => {
      console.error(`migrate: failed — ${error.message}`);
      process.exit(1);
    });
  }
}

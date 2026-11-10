-- Everything up to Arabic + phone lookup, from when this was a single
-- hand-run schema.sql. Every statement is idempotent, so a database that
-- already ran that file can safely take this as its first tracked migration.

create extension if not exists pgcrypto;

create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stamps_required int not null,
  staff_pin_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id),
  stamps_earned int not null default 0,
  stamps_required int not null,
  redemptions int not null default 0,
  last_seen_redemptions int not null default 0,
  lifetime_stamps int not null default 0,
  email text,
  created_at timestamptz not null default now()
);

create index if not exists cards_shop_id_idx on cards(shop_id);

-- Staff PIN lockout — safe to re-run even if shops already exists.
alter table shops add column if not exists failed_pin_attempts int not null default 0;
alter table shops add column if not exists pin_locked_until timestamptz;

-- Cumulative stamps ever given to a card — unlike stamps_earned, this never
-- resets on redemption, so summing it gives a true "total stamps given"
-- metric. Safe to re-run even if cards already exists.
alter table cards add column if not exists lifetime_stamps int not null default 0;

-- Multi-tenant scaffolding (inert for a single-café deployment): a shop can
-- optionally have a slug, used to resolve which shop a request is for when
-- multiple shops are served from one deployment (see middleware.ts). Left
-- null and unused by every single-café (Model A) deployment.
alter table shops add column if not exists slug text;
create unique index if not exists shops_slug_idx on shops(slug) where slug is not null;

-- Owner authentication (also inert until opted in): links a shop to a real
-- Supabase Auth account (auth.users.id). Left null, no FK constraint (kept
-- decoupled from the auth schema on purpose) — until set, shop settings
-- stay gated by the staff PIN exactly as today. See src/lib/shop-auth.ts.
alter table shops add column if not exists owner_user_id uuid;

-- One shop per owner account — self-serve onboarding (src/app/api/onboarding)
-- checks this before inserting, but a unique index closes the race a
-- double-submit could otherwise slip through. Partial for the same reason
-- as the slug index: never applies to a shop without an owner.
create unique index if not exists shops_owner_user_id_idx on shops(owner_user_id) where owner_user_id is not null;

-- Optional customer phone number (E.164, see src/lib/phone.ts) — lets staff
-- find a card by number at the counter and move it to a customer's new
-- phone. Unique per shop, so a lookup by number always finds one card; the
-- same number can still hold a card at each of several shops.
alter table cards add column if not exists phone text;
create unique index if not exists cards_shop_phone_idx on cards(shop_id, phone) where phone is not null;

-- Seed the single shop this MVP operates. Change the PIN before going live.
-- crypt(..., gen_salt('bf')) produces a standard bcrypt hash ($2a$/$2b$
-- prefixed) via pgcrypto. pgcrypto's bcrypt implementation is wire-compatible
-- with bcryptjs, so the Node app can verify this hash directly with
-- bcrypt.compare() — the seed is never stored as plaintext.
insert into shops (name, stamps_required, staff_pin_hash)
select 'Cafe Meridian', 9, crypt('1234', gen_salt('bf'))
where not exists (select 1 from shops);

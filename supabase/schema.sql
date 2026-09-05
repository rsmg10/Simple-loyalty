-- Run this once in the Supabase SQL editor for your project.

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

-- Seed the single shop this MVP operates. Change the PIN before going live.
-- crypt(..., gen_salt('bf')) produces a standard bcrypt hash ($2a$/$2b$
-- prefixed) via pgcrypto. pgcrypto's bcrypt implementation is wire-compatible
-- with bcryptjs, so the Node app can verify this hash directly with
-- bcrypt.compare() — the seed is never stored as plaintext.
insert into shops (name, stamps_required, staff_pin_hash)
select 'Cafe Meridian', 9, crypt('1234', gen_salt('bf'))
where not exists (select 1 from shops);

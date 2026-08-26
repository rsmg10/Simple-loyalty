-- Run this once in the Supabase SQL editor for your project.

create extension if not exists pgcrypto;

create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stamps_required int not null,
  staff_pin text not null,
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
insert into shops (name, stamps_required, staff_pin)
select 'Cafe Meridian', 9, '1234'
where not exists (select 1 from shops);

-- Staff accounts, a stamp/reward log, saved rewards, café branding and
-- promotions, branch groups — and the database functions that change a
-- card, so every change is atomic (no lost stamps when two staff stamp the
-- same card at once) and logged (who did it, and enough to undo it).

-- ── Staff ─────────────────────────────────────────────────────────────
-- Each barista gets their own PIN, which can stamp but not open /setup.
-- The shop's original PIN (shops.staff_pin_hash) becomes the manager PIN.
create table if not exists staff_members (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists staff_members_shop_idx on staff_members(shop_id);
alter table staff_members enable row level security;

-- ── Café settings ─────────────────────────────────────────────────────
alter table shops add column if not exists reward_name text;            -- null = "a free coffee"
alter table shops add column if not exists brand_color text;            -- #rrggbb, null = default ink
alter table shops add column if not exists logo_data_url text;          -- small image, see /api/shop/logo
alter table shops add column if not exists logo_updated_at timestamptz; -- cache key; kept so getShop() needn't load the image
alter table shops add column if not exists welcome_bonus int not null default 0;      -- extra stamps on a first visit
alter table shops add column if not exists double_stamp_weekdays int[] not null default '{}'; -- 0 = Sunday … 6 = Saturday
alter table shops add column if not exists timezone text not null default 'Africa/Tripoli';
-- Branches of one café share cards: a card from any shop in the group can
-- be looked up and stamped at the others. Null = standalone shop.
alter table shops add column if not exists group_id uuid;

-- ── Cards ─────────────────────────────────────────────────────────────
-- `redemptions` stays "rewards earned" (completed cards); `rewards_used`
-- counts rewards actually handed over, so a reward can be saved for later.
-- `visits` counts stamping occasions (one per scan, however many stamps),
-- which is what "returning customer" should mean.
-- Backfilled only when first added: until now every reward was used the
-- moment it was earned, and each stamp was the best guess at a visit.
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'cards' and column_name = 'rewards_used') then
    alter table cards add column rewards_used int not null default 0;
    update cards set rewards_used = redemptions;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'cards' and column_name = 'visits') then
    alter table cards add column visits int not null default 0;
    update cards set visits = lifetime_stamps;
  end if;
end $$;

-- ── Log ───────────────────────────────────────────────────────────────
-- One row per stamp, reward handover or manual adjustment, with the card's
-- state before it — the activity log, the trends, and undo all read this.
create table if not exists stamp_events (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,      -- the branch it happened at
  card_id uuid not null references cards(id) on delete cascade,
  staff_member_id uuid references staff_members(id) on delete set null, -- null = manager PIN / owner
  kind text not null check (kind in ('stamp', 'redeem', 'adjust')),
  stamps_added int not null default 0,   -- purchased stamps (or the adjustment)
  bonus_stamps int not null default 0,   -- promotions on top
  rewards_earned int not null default 0,
  rewards_used int not null default 0,
  stamps_before int not null,
  redemptions_before int not null,
  rewards_used_before int not null,
  lifetime_before int not null,
  visits_before int not null,
  last_stamped_before timestamptz,
  undone_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists stamp_events_shop_created_idx on stamp_events(shop_id, created_at desc);
create index if not exists stamp_events_card_created_idx on stamp_events(card_id, created_at desc);
alter table stamp_events enable row level security;

-- ── Functions ─────────────────────────────────────────────────────────
-- Whether a card may be used at a shop: its own, or one from the same
-- branch group.
create or replace function card_belongs_to_shop(p_card_shop uuid, p_shop uuid)
returns boolean language sql stable as $$
  select p_card_shop = p_shop
      or exists (
        select 1 from shops a join shops b on a.group_id = b.group_id
        where a.id = p_card_shop and b.id = p_shop and a.group_id is not null
      );
$$;

-- Adds `p_count` purchased stamps plus any promotion bonus. Completing the
-- card earns a reward (saved until used) and carries extra stamps onto the
-- next card. Returns {event_id, bonus, card} or null if the card isn't
-- usable at this shop.
create or replace function stamp_card(p_card_id uuid, p_shop_id uuid, p_count int, p_staff_member_id uuid)
returns jsonb language plpgsql as $$
declare
  c cards%rowtype;
  s shops%rowtype;
  total int;
  bonus int := 0;
  earned int;
  ev uuid;
begin
  if p_count < 1 then raise exception 'count must be positive'; end if;
  select * into s from shops where id = p_shop_id;
  select * into c from cards where id = p_card_id for update;
  if not found or not card_belongs_to_shop(c.shop_id, p_shop_id) then return null; end if;

  total := p_count;
  if extract(dow from now() at time zone s.timezone)::int = any(s.double_stamp_weekdays) then
    total := total * 2;
  end if;
  if c.visits = 0 then total := total + s.welcome_bonus; end if;
  bonus := total - p_count;
  earned := (c.stamps_earned + total) / c.stamps_required;

  insert into stamp_events (shop_id, card_id, staff_member_id, kind, stamps_added, bonus_stamps, rewards_earned,
    stamps_before, redemptions_before, rewards_used_before, lifetime_before, visits_before, last_stamped_before)
  values (p_shop_id, c.id, p_staff_member_id, 'stamp', p_count, bonus, earned,
    c.stamps_earned, c.redemptions, c.rewards_used, c.lifetime_stamps, c.visits, c.last_stamped_at)
  returning id into ev;

  update cards set
    stamps_earned = (c.stamps_earned + total) % c.stamps_required,
    redemptions = c.redemptions + earned,
    lifetime_stamps = c.lifetime_stamps + p_count,
    visits = c.visits + 1,
    last_stamped_at = now()
  where id = c.id
  returning * into c;

  return jsonb_build_object('event_id', ev, 'bonus', bonus, 'card', to_jsonb(c));
end $$;

-- Hands over one saved reward. Returns {event_id, card}, {error} when there
-- is none to use, or null if the card isn't usable at this shop.
create or replace function redeem_reward(p_card_id uuid, p_shop_id uuid, p_staff_member_id uuid)
returns jsonb language plpgsql as $$
declare
  c cards%rowtype;
  ev uuid;
begin
  select * into c from cards where id = p_card_id for update;
  if not found or not card_belongs_to_shop(c.shop_id, p_shop_id) then return null; end if;
  if c.redemptions - c.rewards_used < 1 then return jsonb_build_object('error', 'no_reward'); end if;

  insert into stamp_events (shop_id, card_id, staff_member_id, kind, rewards_used,
    stamps_before, redemptions_before, rewards_used_before, lifetime_before, visits_before, last_stamped_before)
  values (p_shop_id, c.id, p_staff_member_id, 'redeem', 1,
    c.stamps_earned, c.redemptions, c.rewards_used, c.lifetime_stamps, c.visits, c.last_stamped_at)
  returning id into ev;

  update cards set rewards_used = c.rewards_used + 1 where id = c.id returning * into c;
  return jsonb_build_object('event_id', ev, 'card', to_jsonb(c));
end $$;

-- Owner correction: sets the card's current stamp count. Logged like
-- everything else.
create or replace function adjust_card_stamps(p_card_id uuid, p_shop_id uuid, p_stamps_earned int)
returns jsonb language plpgsql as $$
declare
  c cards%rowtype;
  ev uuid;
begin
  select * into c from cards where id = p_card_id for update;
  if not found or not card_belongs_to_shop(c.shop_id, p_shop_id) then return null; end if;
  if p_stamps_earned < 0 or p_stamps_earned >= c.stamps_required then
    return jsonb_build_object('error', 'out_of_range');
  end if;

  insert into stamp_events (shop_id, card_id, kind, stamps_added,
    stamps_before, redemptions_before, rewards_used_before, lifetime_before, visits_before, last_stamped_before)
  values (p_shop_id, c.id, 'adjust', p_stamps_earned - c.stamps_earned,
    c.stamps_earned, c.redemptions, c.rewards_used, c.lifetime_stamps, c.visits, c.last_stamped_at)
  returning id into ev;

  update cards set stamps_earned = p_stamps_earned where id = c.id returning * into c;
  return jsonb_build_object('event_id', ev, 'card', to_jsonb(c));
end $$;

-- Reverses an event by restoring the card to its state before it. Only the
-- card's most recent event can be undone (anything later was built on top
-- of it), only at the shop where it happened, and only within
-- p_window_minutes. Returns {card}, {error}, or null if not found.
create or replace function undo_event(p_event_id uuid, p_shop_id uuid, p_window_minutes int)
returns jsonb language plpgsql as $$
declare
  e stamp_events%rowtype;
  c cards%rowtype;
begin
  select * into e from stamp_events where id = p_event_id and shop_id = p_shop_id;
  if not found then return null; end if;
  select * into c from cards where id = e.card_id for update;
  if e.undone_at is not null then return jsonb_build_object('error', 'already_undone'); end if;
  if e.created_at < now() - make_interval(mins => p_window_minutes) then
    return jsonb_build_object('error', 'too_late');
  end if;
  if exists (
    select 1 from stamp_events
    where card_id = e.card_id and undone_at is null and created_at > e.created_at
  ) then
    return jsonb_build_object('error', 'not_latest');
  end if;

  update stamp_events set undone_at = now() where id = e.id;
  update cards set
    stamps_earned = e.stamps_before,
    redemptions = e.redemptions_before,
    rewards_used = e.rewards_used_before,
    lifetime_stamps = e.lifetime_before,
    visits = e.visits_before,
    last_stamped_at = e.last_stamped_before
  where id = c.id
  returning * into c;
  return jsonb_build_object('card', to_jsonb(c));
end $$;

-- Only the app (service role) may call these. Supabase's REST API exposes
-- functions in `public`, and Postgres lets everyone execute new functions
-- by default; RLS would already stop the anon key changing anything
-- through them, but they shouldn't be callable at all.
revoke execute on function card_belongs_to_shop(uuid, uuid) from public;
revoke execute on function stamp_card(uuid, uuid, int, uuid) from public;
revoke execute on function redeem_reward(uuid, uuid, uuid) from public;
revoke execute on function adjust_card_stamps(uuid, uuid, int) from public;
revoke execute on function undo_event(uuid, uuid, int) from public;
do $$
declare
  fns text := 'card_belongs_to_shop(uuid, uuid), stamp_card(uuid, uuid, int, uuid), redeem_reward(uuid, uuid, uuid), adjust_card_stamps(uuid, uuid, int), undo_event(uuid, uuid, int)';
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function ' || fns || ' from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function ' || fns || ' from authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function ' || fns || ' to service_role';
  end if;
end $$;

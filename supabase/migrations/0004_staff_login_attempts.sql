-- Failed staff-PIN attempts per client (a keyed hash of the IP address,
-- never the raw address), so a wrong-PIN streak locks out the device that's
-- guessing instead of the whole café. The shop-wide counter on `shops`
-- stays as a backstop against guessing from many devices at once. See
-- src/lib/login-throttle.ts.
create table if not exists staff_login_attempts (
  shop_id uuid not null references shops(id) on delete cascade,
  client_key text not null,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (shop_id, client_key)
);

alter table staff_login_attempts enable row level security;

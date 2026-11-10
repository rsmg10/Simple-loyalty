-- Supabase grants the public `anon` and `authenticated` roles access to
-- tables in `public` by default, and the anon key ships to every browser
-- once owner authentication is enabled. Without RLS, that key could read
-- every card (phone numbers, emails) and every shop (PIN hashes) through
-- Supabase's REST API, or change them.
--
-- RLS with no policies denies both roles everything. The app is unaffected:
-- all its data access goes through the service-role key, which bypasses RLS.
alter table shops enable row level security;
alter table cards enable row level security;

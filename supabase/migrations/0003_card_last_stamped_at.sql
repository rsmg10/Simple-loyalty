-- When a card last received a stamp — powers the "active in the last 30
-- days" dashboard metric and sorts the owner's customer list. Null for
-- cards never stamped (or only stamped before this column existed).
alter table cards add column if not exists last_stamped_at timestamptz;

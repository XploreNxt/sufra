-- =============================================================
-- Customer favourites: saved restaurants for quick re-access.
-- =============================================================

create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, restaurant_id)
);
create index favorites_user_idx on favorites (user_id);

alter table favorites enable row level security;

create policy "favorites: owner crud" on favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

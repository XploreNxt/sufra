-- =============================================================
-- Web push subscriptions (one row per browser/device per user).
-- =============================================================

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

create policy "push_subscriptions: owner crud" on push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

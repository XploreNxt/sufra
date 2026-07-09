-- =============================================================
-- Menu moderation: vendor edits (incl. images) need admin approval
-- before customers see them. Plus a Storage bucket for item images.
-- =============================================================

create type menu_item_status as enum ('approved', 'pending', 'rejected');

alter table menu_items
  add column status menu_item_status not null default 'pending',
  add column rejection_reason text;

-- Existing seeded items are already live.
update menu_items set status = 'approved';

-- Customers only see approved items. Vendors (own) and admin still see all
-- of theirs via the existing FOR ALL policies, so pending/rejected items
-- remain visible in the vendor panel and the admin queue.
drop policy if exists "menu_items: public read" on menu_items;
create policy "menu_items: public read approved" on menu_items
  for select using (status = 'approved');

-- ---------------- Storage: menu item images ----------------
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

drop policy if exists "menu-images public read" on storage.objects;
create policy "menu-images public read" on storage.objects
  for select using (bucket_id = 'menu-images');

drop policy if exists "menu-images authed insert" on storage.objects;
create policy "menu-images authed insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'menu-images');

drop policy if exists "menu-images authed update" on storage.objects;
create policy "menu-images authed update" on storage.objects
  for update to authenticated using (bucket_id = 'menu-images');

drop policy if exists "menu-images authed delete" on storage.objects;
create policy "menu-images authed delete" on storage.objects
  for delete to authenticated using (bucket_id = 'menu-images');

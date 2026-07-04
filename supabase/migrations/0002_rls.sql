-- =============================================================
-- Row Level Security — each role only sees its own data
-- =============================================================

-- Helper: current user's role, without tripping RLS recursion on users.
-- SECURITY DEFINER runs as the table owner, bypassing RLS inside the fn.
create or replace function public.current_role_of_user()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(public.current_role_of_user() = 'admin', false);
$$;

-- Helper: restaurant ids owned by the current user (vendor side).
create or replace function public.owned_restaurant_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select id from public.restaurants where owner_user_id = auth.uid();
$$;

-- Helper: rider row id for the current user.
create or replace function public.current_rider_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.riders where user_id = auth.uid();
$$;

-- ---------- Enable RLS everywhere ----------
alter table users enable row level security;
alter table addresses enable row level security;
alter table zones enable row level security;
alter table restaurants enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table modifier_groups enable row level security;
alter table modifiers enable row level security;
alter table riders enable row level security;
alter table vouchers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_item_modifiers enable row level security;
alter table payments enable row level security;
alter table cod_ledger enable row level security;
alter table reviews enable row level security;

-- ---------- users ----------
create policy "users: read own profile" on users
  for select using (id = auth.uid() or is_admin());
create policy "users: update own profile" on users
  for update using (id = auth.uid() or is_admin())
  with check (
    -- non-admins cannot change their own role
    is_admin() or (id = auth.uid() and role = (select u.role from users u where u.id = auth.uid()))
  );
create policy "users: admin manage" on users
  for all using (is_admin());

-- ---------- addresses ----------
create policy "addresses: owner crud" on addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "addresses: admin read" on addresses
  for select using (is_admin());
-- Vendors/riders need the delivery address of orders sent to them;
-- handled through order-scoped server queries in later phases.

-- ---------- zones ----------
create policy "zones: public read" on zones
  for select using (true);
create policy "zones: admin manage" on zones
  for all using (is_admin());

-- ---------- restaurants ----------
create policy "restaurants: public read active" on restaurants
  for select using (status = 'active' or owner_user_id = auth.uid() or is_admin());
create policy "restaurants: vendor insert own" on restaurants
  for insert with check (owner_user_id = auth.uid());
create policy "restaurants: vendor update own" on restaurants
  for update using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid()
    -- vendors cannot self-approve or change their commission
    and status = (select r.status from restaurants r where r.id = restaurants.id)
    and commission_rate = (select r.commission_rate from restaurants r where r.id = restaurants.id));
create policy "restaurants: admin manage" on restaurants
  for all using (is_admin());

-- ---------- menu (categories, items, modifier groups, modifiers) ----------
create policy "menu_categories: public read" on menu_categories
  for select using (true);
create policy "menu_categories: vendor manage own" on menu_categories
  for all using (restaurant_id in (select owned_restaurant_ids()))
  with check (restaurant_id in (select owned_restaurant_ids()));
create policy "menu_categories: admin manage" on menu_categories
  for all using (is_admin());

create policy "menu_items: public read" on menu_items
  for select using (true);
create policy "menu_items: vendor manage own" on menu_items
  for all using (restaurant_id in (select owned_restaurant_ids()))
  with check (restaurant_id in (select owned_restaurant_ids()));
create policy "menu_items: admin manage" on menu_items
  for all using (is_admin());

create policy "modifier_groups: public read" on modifier_groups
  for select using (true);
create policy "modifier_groups: vendor manage own" on modifier_groups
  for all using (menu_item_id in (
    select id from menu_items where restaurant_id in (select owned_restaurant_ids())))
  with check (menu_item_id in (
    select id from menu_items where restaurant_id in (select owned_restaurant_ids())));
create policy "modifier_groups: admin manage" on modifier_groups
  for all using (is_admin());

create policy "modifiers: public read" on modifiers
  for select using (true);
create policy "modifiers: vendor manage own" on modifiers
  for all using (group_id in (
    select mg.id from modifier_groups mg
    join menu_items mi on mi.id = mg.menu_item_id
    where mi.restaurant_id in (select owned_restaurant_ids())))
  with check (group_id in (
    select mg.id from modifier_groups mg
    join menu_items mi on mi.id = mg.menu_item_id
    where mi.restaurant_id in (select owned_restaurant_ids())));
create policy "modifiers: admin manage" on modifiers
  for all using (is_admin());

-- ---------- riders ----------
create policy "riders: read own row" on riders
  for select using (user_id = auth.uid() or is_admin());
create policy "riders: apply as rider" on riders
  for insert with check (user_id = auth.uid() and status = 'pending');
create policy "riders: update own status/location" on riders
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid()
    -- riders cannot self-approve
    and status = (select r.status from riders r where r.id = riders.id));
create policy "riders: admin manage" on riders
  for all using (is_admin());

-- ---------- vouchers ----------
create policy "vouchers: read active" on vouchers
  for select using (is_active or is_admin());
create policy "vouchers: admin manage" on vouchers
  for all using (is_admin());

-- ---------- orders ----------
create policy "orders: customer read own" on orders
  for select using (customer_id = auth.uid());
create policy "orders: vendor read own restaurant" on orders
  for select using (restaurant_id in (select owned_restaurant_ids()));
create policy "orders: rider read assigned" on orders
  for select using (rider_id = current_rider_id());
create policy "orders: admin read" on orders
  for select using (is_admin());
create policy "orders: customer place" on orders
  for insert with check (customer_id = auth.uid() and status = 'pending');
create policy "orders: vendor update own restaurant" on orders
  for update using (restaurant_id in (select owned_restaurant_ids()));
create policy "orders: rider update assigned" on orders
  for update using (rider_id = current_rider_id());
create policy "orders: admin manage" on orders
  for all using (is_admin());
-- Status-transition enforcement is done in server actions (Phase 3+);
-- RLS here scopes WHO can touch an order, not WHICH transition is legal.

-- ---------- order_items / order_item_modifiers ----------
create policy "order_items: parties read" on order_items
  for select using (order_id in (
    select id from orders
    where customer_id = auth.uid()
       or restaurant_id in (select owned_restaurant_ids())
       or rider_id = current_rider_id())
    or is_admin());
create policy "order_items: customer insert with own order" on order_items
  for insert with check (order_id in (
    select id from orders where customer_id = auth.uid() and status = 'pending'));
create policy "order_items: admin manage" on order_items
  for all using (is_admin());

create policy "order_item_modifiers: parties read" on order_item_modifiers
  for select using (order_item_id in (
    select oi.id from order_items oi
    join orders o on o.id = oi.order_id
    where o.customer_id = auth.uid()
       or o.restaurant_id in (select owned_restaurant_ids())
       or o.rider_id = current_rider_id())
    or is_admin());
create policy "order_item_modifiers: customer insert with own order" on order_item_modifiers
  for insert with check (order_item_id in (
    select oi.id from order_items oi
    join orders o on o.id = oi.order_id
    where o.customer_id = auth.uid() and o.status = 'pending'));
create policy "order_item_modifiers: admin manage" on order_item_modifiers
  for all using (is_admin());

-- ---------- payments ----------
create policy "payments: parties read" on payments
  for select using (order_id in (
    select id from orders
    where customer_id = auth.uid()
       or restaurant_id in (select owned_restaurant_ids())
       or rider_id = current_rider_id())
    or is_admin());
create policy "payments: admin manage" on payments
  for all using (is_admin());
-- Payment writes happen via server actions / service role (Phases 3, 5, 8).

-- ---------- cod_ledger ----------
create policy "cod_ledger: rider read own" on cod_ledger
  for select using (rider_id = current_rider_id() or is_admin());
create policy "cod_ledger: admin manage" on cod_ledger
  for all using (is_admin());
-- Ledger rows are created by the delivery server action (Phase 5).

-- ---------- reviews ----------
create policy "reviews: public read" on reviews
  for select using (true);
create policy "reviews: customer review own delivered order" on reviews
  for insert with check (
    customer_id = auth.uid()
    and order_id in (
      select id from orders where customer_id = auth.uid() and status = 'delivered'));
create policy "reviews: admin manage" on reviews
  for all using (is_admin());

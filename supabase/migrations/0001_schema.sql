-- =============================================================
-- Food Delivery Marketplace — initial schema (Blueprint §4)
-- =============================================================

-- ---------- Enums ----------
create type user_role as enum ('customer', 'vendor', 'rider', 'admin');
create type restaurant_status as enum ('pending', 'active', 'suspended');
create type rider_status as enum ('pending', 'active', 'suspended');
create type order_status as enum (
  'pending', 'accepted', 'preparing', 'ready', 'assigned',
  'picked_up', 'on_the_way', 'delivered', 'rejected', 'cancelled'
);
create type payment_method as enum ('cod', 'jazzcash', 'easypaisa', 'card');
create type payment_provider as enum ('jazzcash', 'easypaisa', 'card', 'cod');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type discount_type as enum ('percent', 'fixed');

-- ---------- Identity & location ----------
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text unique,
  email text,
  full_name text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  label text,
  address_text text,
  landmark text,          -- landmark + pin are the real navigation data in PK
  lat double precision,
  lng double precision,
  city text,
  is_default boolean not null default false
);
create index addresses_user_id_idx on addresses (user_id);

-- ---------- Supporting (zones needed by riders FK) ----------
create table zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  delivery_fee numeric(10, 2) not null default 0,
  bounds jsonb              -- GeoJSON polygon; per-area pricing + dispatch
);

-- ---------- Restaurants & menu ----------
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users (id) on delete cascade,
  name text not null,
  description text,
  cuisine_types text[] not null default '{}',
  logo_url text,
  cover_url text,
  address_text text,
  lat double precision,
  lng double precision,
  phone text,
  commission_rate numeric(5, 2) not null default 0, -- percent
  min_order numeric(10, 2) not null default 0,
  delivery_fee numeric(10, 2) not null default 0,
  default_prep_minutes integer not null default 20,
  status restaurant_status not null default 'pending',
  is_open boolean not null default false,
  rating_avg numeric(3, 2),
  created_at timestamptz not null default now()
);
create index restaurants_owner_idx on restaurants (owner_user_id);
create index restaurants_status_idx on restaurants (status);

create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0
);
create index menu_categories_restaurant_idx on menu_categories (restaurant_id);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  category_id uuid references menu_categories (id) on delete set null,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  image_url text,
  is_available boolean not null default true,
  sort_order integer not null default 0
);
create index menu_items_restaurant_idx on menu_items (restaurant_id);
create index menu_items_category_idx on menu_items (category_id);

create table modifier_groups (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items (id) on delete cascade,
  name text not null,
  min_select integer not null default 0,
  max_select integer not null default 1,
  is_required boolean not null default false
);
create index modifier_groups_item_idx on modifier_groups (menu_item_id);

create table modifiers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references modifier_groups (id) on delete cascade,
  name text not null,
  price_delta numeric(10, 2) not null default 0
);
create index modifiers_group_idx on modifiers (group_id);

-- ---------- Riders ----------
create table riders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users (id) on delete cascade,
  vehicle_type text,
  cnic text,
  license_no text,
  status rider_status not null default 'pending',
  is_online boolean not null default false,
  current_lat double precision,
  current_lng double precision,
  zone_id uuid references zones (id) on delete set null
);
create index riders_zone_idx on riders (zone_id);
create index riders_online_idx on riders (is_online) where is_online;

-- ---------- Vouchers (needed by orders FK) ----------
create table vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type discount_type not null,
  value numeric(10, 2) not null,
  min_order numeric(10, 2) not null default 0,
  max_discount numeric(10, 2),
  valid_from timestamptz,
  valid_to timestamptz,
  usage_limit integer,
  times_used integer not null default 0,
  is_active boolean not null default true
);

-- ---------- Orders (the core) ----------
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references users (id),
  restaurant_id uuid not null references restaurants (id),
  rider_id uuid references riders (id),
  address_id uuid references addresses (id),
  status order_status not null default 'pending',
  subtotal numeric(10, 2) not null default 0,
  delivery_fee numeric(10, 2) not null default 0,
  tax numeric(10, 2) not null default 0,
  discount numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  payment_method payment_method not null default 'cod',
  payment_status payment_status not null default 'pending',
  cod_amount numeric(10, 2),
  voucher_id uuid references vouchers (id),
  placed_at timestamptz not null default now(),
  accepted_at timestamptz,
  ready_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz
);
create index orders_customer_idx on orders (customer_id);
create index orders_restaurant_idx on orders (restaurant_id);
create index orders_rider_idx on orders (rider_id);
create index orders_status_idx on orders (status);

-- Snapshot name/price at order time: past orders stay accurate
-- even if the menu is edited later.
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  menu_item_id uuid references menu_items (id) on delete set null,
  name_snapshot text not null,
  price_snapshot numeric(10, 2) not null,
  quantity integer not null default 1,
  special_instructions text
);
create index order_items_order_idx on order_items (order_id);

create table order_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items (id) on delete cascade,
  name_snapshot text not null,
  price_snapshot numeric(10, 2) not null
);
create index order_item_modifiers_item_idx on order_item_modifiers (order_item_id);

-- ---------- Money ----------
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id),
  method payment_method not null,
  amount numeric(10, 2) not null,
  provider payment_provider not null,
  provider_ref text,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index payments_order_idx on payments (order_id);

-- The COD ledger: what the rider collected vs. what they owe the
-- platform after their cut. The operational heart of a cash-first market.
create table cod_ledger (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references riders (id),
  order_id uuid not null references orders (id),
  amount_collected numeric(10, 2) not null,
  amount_owed_to_platform numeric(10, 2) not null,
  is_settled boolean not null default false,
  settled_at timestamptz
);
create index cod_ledger_rider_idx on cod_ledger (rider_id);
create index cod_ledger_unsettled_idx on cod_ledger (rider_id) where not is_settled;

-- ---------- Reviews ----------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders (id),
  customer_id uuid not null references users (id),
  restaurant_id uuid not null references restaurants (id),
  rider_id uuid references riders (id),
  restaurant_rating integer check (restaurant_rating between 1 and 5),
  rider_rating integer check (rider_rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index reviews_restaurant_idx on reviews (restaurant_id);

-- ---------- Auto-create profile row on signup ----------
-- Every auth.users row gets a public.users profile (default role: customer).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, phone, email)
  values (new.id, new.phone, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

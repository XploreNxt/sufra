-- =============================================================
-- Offers / bundles: a vendor groups existing menu items into a
-- deal at a set price, shown in a featured section above the menu.
-- Bundles go live instantly (no approval). Ordering a bundle creates
-- one order line at the bundle price, with the contents listed under it.
-- =============================================================

create table bundles (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  price numeric(10, 2) not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index bundles_restaurant_idx on bundles (restaurant_id);

create table bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references bundles (id) on delete cascade,
  menu_item_id uuid not null references menu_items (id) on delete cascade,
  quantity integer not null default 1
);
create index bundle_items_bundle_idx on bundle_items (bundle_id);

alter table bundles enable row level security;
alter table bundle_items enable row level security;

create policy "bundles: public read active" on bundles
  for select using (is_active);
create policy "bundles: vendor manage own" on bundles
  for all using (restaurant_id in (select owned_restaurant_ids()))
  with check (restaurant_id in (select owned_restaurant_ids()));
create policy "bundles: admin manage" on bundles
  for all using (is_admin());

create policy "bundle_items: public read" on bundle_items
  for select using (bundle_id in (select id from bundles where is_active));
create policy "bundle_items: vendor manage own" on bundle_items
  for all using (
    bundle_id in (
      select b.id from bundles b
      where b.restaurant_id in (select owned_restaurant_ids()))
  )
  with check (
    bundle_id in (
      select b.id from bundles b
      where b.restaurant_id in (select owned_restaurant_ids()))
  );
create policy "bundle_items: admin manage" on bundle_items
  for all using (is_admin());

-- place_order gains p_bundles: [{bundle_id, quantity}]. Drop the old 4-arg
-- version first so the new signature isn't ambiguous with it.
drop function if exists public.place_order(uuid, uuid, jsonb, text);

create or replace function public.place_order(
  p_restaurant_id uuid,
  p_address_id uuid,
  p_items jsonb,
  p_voucher_code text default null,
  p_bundles jsonb default '[]'::jsonb
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_customer uuid := auth.uid();
  v_rest restaurants%rowtype;
  v_order_id uuid;
  v_subtotal numeric(10,2) := 0;
  v_item jsonb; v_mi menu_items%rowtype; v_qty int;
  v_mod modifiers%rowtype; v_mod_id uuid; v_order_item_id uuid;
  v_mod_total numeric(10,2); v_total numeric(10,2);
  v_discount numeric(10,2) := 0; v_voucher_id uuid := null;
  v_bundle_row jsonb; v_bundle bundles%rowtype; v_bi record;
begin
  if v_customer is null then raise exception 'Please sign in to place an order'; end if;
  select * into v_rest from restaurants where id = p_restaurant_id and status = 'active';
  if not found then raise exception 'Restaurant not available'; end if;
  if not v_rest.is_open then raise exception 'Restaurant is closed right now'; end if;
  perform 1 from addresses where id = p_address_id and user_id = v_customer;
  if not found then raise exception 'Invalid delivery address'; end if;
  if (p_items is null or jsonb_array_length(p_items) = 0)
     and (p_bundles is null or jsonb_array_length(p_bundles) = 0) then
    raise exception 'Cart is empty';
  end if;

  insert into orders (customer_id, restaurant_id, address_id, status, subtotal, delivery_fee, tax, discount, total, payment_method, payment_status, cod_amount)
  values (v_customer, p_restaurant_id, p_address_id, 'pending', 0, v_rest.delivery_fee, 0, 0, 0, 'cod', 'pending', 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    select * into v_mi from menu_items where id = (v_item->>'menu_item_id')::uuid and restaurant_id = p_restaurant_id and is_available;
    if not found then raise exception 'An item in your cart is no longer available'; end if;
    v_qty := coalesce((v_item->>'quantity')::int, 1);
    if v_qty < 1 or v_qty > 50 then raise exception 'Invalid quantity'; end if;
    insert into order_items (order_id, menu_item_id, name_snapshot, price_snapshot, quantity, special_instructions)
    values (v_order_id, v_mi.id, v_mi.name, v_mi.price, v_qty, nullif(v_item->>'special_instructions', ''))
    returning id into v_order_item_id;
    v_mod_total := 0;
    if v_item ? 'modifier_ids' then
      for v_mod_id in select (value #>> '{}')::uuid from jsonb_array_elements(v_item->'modifier_ids') loop
        select m.* into v_mod from modifiers m join modifier_groups g on g.id = m.group_id where m.id = v_mod_id and g.menu_item_id = v_mi.id;
        if not found then raise exception 'Invalid item option'; end if;
        insert into order_item_modifiers (order_item_id, name_snapshot, price_snapshot) values (v_order_item_id, v_mod.name, v_mod.price_delta);
        v_mod_total := v_mod_total + v_mod.price_delta;
      end loop;
    end if;
    v_subtotal := v_subtotal + (v_mi.price + v_mod_total) * v_qty;
  end loop;

  for v_bundle_row in select * from jsonb_array_elements(coalesce(p_bundles, '[]'::jsonb)) loop
    select * into v_bundle from bundles where id = (v_bundle_row->>'bundle_id')::uuid and restaurant_id = p_restaurant_id and is_active;
    if not found then raise exception 'A deal in your cart is no longer available'; end if;
    v_qty := coalesce((v_bundle_row->>'quantity')::int, 1);
    if v_qty < 1 or v_qty > 50 then raise exception 'Invalid quantity'; end if;
    insert into order_items (order_id, menu_item_id, name_snapshot, price_snapshot, quantity)
    values (v_order_id, null, v_bundle.name, v_bundle.price, v_qty)
    returning id into v_order_item_id;
    for v_bi in
      select bi.quantity as q, mi.name as nm from bundle_items bi
      join menu_items mi on mi.id = bi.menu_item_id where bi.bundle_id = v_bundle.id
    loop
      insert into order_item_modifiers (order_item_id, name_snapshot, price_snapshot)
      values (v_order_item_id, v_bi.q::text || 'x ' || v_bi.nm, 0);
    end loop;
    v_subtotal := v_subtotal + v_bundle.price * v_qty;
  end loop;

  if v_subtotal < v_rest.min_order then raise exception 'Minimum order for this restaurant is Rs %', v_rest.min_order::text; end if;

  if p_voucher_code is not null and trim(p_voucher_code) <> '' then
    select cv.voucher_id, cv.discount into v_voucher_id, v_discount from public.compute_voucher_discount(p_voucher_code, v_subtotal, p_restaurant_id, true) cv;
    update vouchers set times_used = times_used + 1 where id = v_voucher_id;
  end if;

  v_total := v_subtotal - v_discount + v_rest.delivery_fee;
  update orders set subtotal = v_subtotal, discount = v_discount, voucher_id = v_voucher_id, total = v_total, cod_amount = v_total where id = v_order_id;
  insert into payments (order_id, method, amount, provider, status) values (v_order_id, 'cod', v_total, 'cod', 'pending');
  return v_order_id;
end;
$$;

grant execute on function public.place_order(uuid, uuid, jsonb, text, jsonb) to authenticated;

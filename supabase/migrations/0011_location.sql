-- =============================================================
-- Vendor location pin + per-restaurant delivery radius.
--
--  * delivery_radius_km  — vendor-set, saved instantly (default 15).
--  * pending_lat/lng     — a pin change staged for admin approval; the
--                          live lat/lng keeps working until approved.
--  * location_rejection_reason — shown back to the vendor on reject.
--
-- A restaurant is only discoverable once it has an APPROVED pin
-- (lat/lng not null), and a customer only sees it when they fall
-- inside that restaurant's delivery_radius_km. Checkout is hard-blocked
-- server-side when the delivery address is outside the radius.
-- =============================================================

alter table restaurants
  add column delivery_radius_km numeric(6, 2) not null default 15,
  add column pending_lat double precision,
  add column pending_lng double precision,
  add column location_rejection_reason text;

-- Lock lat/lng from direct vendor edits — pin changes must flow through
-- pending_lat/pending_lng + admin approval. Radius stays freely editable.
drop policy if exists "restaurants: vendor update own" on restaurants;
create policy "restaurants: vendor update own" on restaurants
  for update using (owner_user_id = auth.uid())
  with check (
    owner_user_id = auth.uid()
    and status = (select r.status from restaurants r where r.id = restaurants.id)
    and commission_rate = (select r.commission_rate from restaurants r where r.id = restaurants.id)
    and name = (select r.name from restaurants r where r.id = restaurants.id)
    and address_text is not distinct from
        (select r.address_text from restaurants r where r.id = restaurants.id)
    and lat is not distinct from (select r.lat from restaurants r where r.id = restaurants.id)
    and lng is not distinct from (select r.lng from restaurants r where r.id = restaurants.id)
  );

-- Great-circle (haversine) distance in kilometres between two points.
create or replace function public.distance_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision
language sql immutable as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- place_order: unchanged signature, now hard-blocks orders whose delivery
-- address falls outside the restaurant's delivery radius (only when both
-- the restaurant pin and the address have coordinates).
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
  v_addr_lat double precision; v_addr_lng double precision; v_dist double precision;
begin
  if v_customer is null then raise exception 'Please sign in to place an order'; end if;
  select * into v_rest from restaurants where id = p_restaurant_id and status = 'active';
  if not found then raise exception 'Restaurant not available'; end if;
  if not v_rest.is_open then raise exception 'Restaurant is closed right now'; end if;

  select lat, lng into v_addr_lat, v_addr_lng
    from addresses where id = p_address_id and user_id = v_customer;
  if not found then raise exception 'Invalid delivery address'; end if;

  -- Delivery-radius hard block.
  if v_rest.lat is not null and v_rest.lng is not null
     and v_addr_lat is not null and v_addr_lng is not null then
    v_dist := public.distance_km(v_rest.lat, v_rest.lng, v_addr_lat, v_addr_lng);
    if v_dist > v_rest.delivery_radius_km then
      raise exception 'This restaurant does not deliver to your address — it is % km away (limit % km)',
        round(v_dist::numeric, 1)::text, v_rest.delivery_radius_km::text;
    end if;
  end if;

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

-- =============================================================
-- Phase 9: vouchers at checkout + ratings & reviews.
-- place_order gains an optional voucher code (validated, locked,
-- usage-counted inside the same transaction). submit_review keeps
-- restaurants.rating_avg in sync.
-- =============================================================

-- Shared voucher validation. Locks the row when p_lock so the
-- usage counter can't race.
create or replace function public.compute_voucher_discount(
  p_code text,
  p_subtotal numeric,
  p_lock boolean
) returns table (voucher_id uuid, discount numeric)
language plpgsql security definer set search_path = public
as $$
declare
  v vouchers%rowtype;
begin
  if p_lock then
    select * into v from vouchers
     where upper(code) = upper(trim(p_code)) for update;
  else
    select * into v from vouchers
     where upper(code) = upper(trim(p_code));
  end if;

  if not found or not v.is_active then
    raise exception 'Invalid voucher code';
  end if;
  if v.valid_from is not null and now() < v.valid_from then
    raise exception 'This voucher is not active yet';
  end if;
  if v.valid_to is not null and now() > v.valid_to then
    raise exception 'This voucher has expired';
  end if;
  if v.usage_limit is not null and v.times_used >= v.usage_limit then
    raise exception 'This voucher has been fully redeemed';
  end if;
  if p_subtotal < v.min_order then
    raise exception 'Voucher needs a minimum order of Rs %', v.min_order::text;
  end if;

  discount := case v.discount_type
    when 'percent' then round(p_subtotal * v.value / 100, 2)
    else v.value
  end;
  if v.max_discount is not null then
    discount := least(discount, v.max_discount);
  end if;
  discount := least(discount, p_subtotal);
  voucher_id := v.id;
  return next;
end;
$$;

-- Checkout preview: "how much is this code worth on my cart?"
create or replace function public.preview_voucher(
  p_code text,
  p_subtotal numeric
) returns numeric
language sql stable security definer set search_path = public
as $$
  select discount from public.compute_voucher_discount(p_code, p_subtotal, false);
$$;

-- Replace the 3-arg place_order with a voucher-aware 4-arg version.
drop function if exists public.place_order(uuid, uuid, jsonb);

create or replace function public.place_order(
  p_restaurant_id uuid,
  p_address_id uuid,
  p_items jsonb,
  p_voucher_code text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer uuid := auth.uid();
  v_rest restaurants%rowtype;
  v_order_id uuid;
  v_subtotal numeric(10,2) := 0;
  v_item jsonb;
  v_mi menu_items%rowtype;
  v_qty int;
  v_mod modifiers%rowtype;
  v_mod_id uuid;
  v_order_item_id uuid;
  v_mod_total numeric(10,2);
  v_total numeric(10,2);
  v_discount numeric(10,2) := 0;
  v_voucher_id uuid := null;
begin
  if v_customer is null then
    raise exception 'Please sign in to place an order';
  end if;

  select * into v_rest from restaurants
   where id = p_restaurant_id and status = 'active';
  if not found then raise exception 'Restaurant not available'; end if;
  if not v_rest.is_open then raise exception 'Restaurant is closed right now'; end if;

  perform 1 from addresses where id = p_address_id and user_id = v_customer;
  if not found then raise exception 'Invalid delivery address'; end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  insert into orders (
    customer_id, restaurant_id, address_id, status,
    subtotal, delivery_fee, tax, discount, total,
    payment_method, payment_status, cod_amount
  ) values (
    v_customer, p_restaurant_id, p_address_id, 'pending',
    0, v_rest.delivery_fee, 0, 0, 0,
    'cod', 'pending', 0
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_mi from menu_items
     where id = (v_item->>'menu_item_id')::uuid
       and restaurant_id = p_restaurant_id
       and is_available;
    if not found then
      raise exception 'An item in your cart is no longer available';
    end if;

    v_qty := coalesce((v_item->>'quantity')::int, 1);
    if v_qty < 1 or v_qty > 50 then raise exception 'Invalid quantity'; end if;

    insert into order_items (
      order_id, menu_item_id, name_snapshot, price_snapshot,
      quantity, special_instructions
    ) values (
      v_order_id, v_mi.id, v_mi.name, v_mi.price,
      v_qty, nullif(v_item->>'special_instructions', '')
    ) returning id into v_order_item_id;

    v_mod_total := 0;
    if v_item ? 'modifier_ids' then
      for v_mod_id in
        select (value #>> '{}')::uuid from jsonb_array_elements(v_item->'modifier_ids')
      loop
        select m.* into v_mod
          from modifiers m
          join modifier_groups g on g.id = m.group_id
         where m.id = v_mod_id and g.menu_item_id = v_mi.id;
        if not found then raise exception 'Invalid item option'; end if;

        insert into order_item_modifiers (order_item_id, name_snapshot, price_snapshot)
        values (v_order_item_id, v_mod.name, v_mod.price_delta);
        v_mod_total := v_mod_total + v_mod.price_delta;
      end loop;
    end if;

    v_subtotal := v_subtotal + (v_mi.price + v_mod_total) * v_qty;
  end loop;

  if v_subtotal < v_rest.min_order then
    raise exception 'Minimum order for this restaurant is Rs %', v_rest.min_order::text;
  end if;

  if p_voucher_code is not null and trim(p_voucher_code) <> '' then
    select cv.voucher_id, cv.discount into v_voucher_id, v_discount
      from public.compute_voucher_discount(p_voucher_code, v_subtotal, true) cv;
    update vouchers set times_used = times_used + 1 where id = v_voucher_id;
  end if;

  v_total := v_subtotal - v_discount + v_rest.delivery_fee;

  update orders
     set subtotal = v_subtotal,
         discount = v_discount,
         voucher_id = v_voucher_id,
         total = v_total,
         cod_amount = v_total
   where id = v_order_id;

  insert into payments (order_id, method, amount, provider, status)
  values (v_order_id, 'cod', v_total, 'cod', 'pending');

  return v_order_id;
end;
$$;

-- Reviews: one per delivered order; keeps restaurant rating_avg fresh.
create or replace function public.submit_review(
  p_order_id uuid,
  p_restaurant_rating int,
  p_rider_rating int default null,
  p_comment text default null
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_order orders%rowtype;
begin
  if p_restaurant_rating is null or p_restaurant_rating not between 1 and 5 then
    raise exception 'Restaurant rating must be 1-5';
  end if;
  if p_rider_rating is not null and p_rider_rating not between 1 and 5 then
    raise exception 'Rider rating must be 1-5';
  end if;

  select * into v_order from orders
   where id = p_order_id and customer_id = auth.uid();
  if not found then raise exception 'Order not found'; end if;
  if v_order.status <> 'delivered' then
    raise exception 'You can review an order once it is delivered';
  end if;

  begin
    insert into reviews (
      order_id, customer_id, restaurant_id, rider_id,
      restaurant_rating, rider_rating, comment
    ) values (
      p_order_id, v_order.customer_id, v_order.restaurant_id, v_order.rider_id,
      p_restaurant_rating, p_rider_rating, nullif(trim(coalesce(p_comment, '')), '')
    );
  exception when unique_violation then
    raise exception 'You already reviewed this order';
  end;

  update restaurants r
     set rating_avg = (
       select round(avg(restaurant_rating)::numeric, 2)
         from reviews
        where restaurant_id = v_order.restaurant_id
          and restaurant_rating is not null)
   where r.id = v_order.restaurant_id;
end;
$$;

revoke execute on function public.compute_voucher_discount(text, numeric, boolean) from public;
revoke execute on function public.preview_voucher(text, numeric) from public;
revoke execute on function public.place_order(uuid, uuid, jsonb, text) from public;
revoke execute on function public.submit_review(uuid, int, int, text) from public;
grant execute on function public.preview_voucher(text, numeric) to authenticated;
grant execute on function public.place_order(uuid, uuid, jsonb, text) to authenticated;
grant execute on function public.submit_review(uuid, int, int, text) to authenticated;

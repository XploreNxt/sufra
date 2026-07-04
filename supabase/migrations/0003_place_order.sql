-- =============================================================
-- place_order(): atomic order creation with server-side pricing.
-- Prices/names are re-read from menu tables — the client's numbers
-- are never trusted. Runs as SECURITY DEFINER so it can write
-- orders + items + modifiers + payment in one transaction.
-- =============================================================

create or replace function public.place_order(
  p_restaurant_id uuid,
  p_address_id uuid,
  p_items jsonb
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

  v_total := v_subtotal + v_rest.delivery_fee;

  update orders
     set subtotal = v_subtotal, total = v_total, cod_amount = v_total
   where id = v_order_id;

  insert into payments (order_id, method, amount, provider, status)
  values (v_order_id, 'cod', v_total, 'cod', 'pending');

  return v_order_id;
end;
$$;

revoke execute on function public.place_order(uuid, uuid, jsonb) from public;
grant execute on function public.place_order(uuid, uuid, jsonb) to authenticated;

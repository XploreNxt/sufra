-- =============================================================
-- Rider flows: available-order pool, race-safe self-assign,
-- delivery status transitions, COD ledger on delivery.
-- SECURITY DEFINER so riders can see the unassigned pool and the
-- delivery address of their own order without widening table RLS.
-- =============================================================

-- Orders ready for pickup, visible to active + online riders only.
create or replace function public.rider_available_orders()
returns table (
  order_id uuid,
  restaurant_name text,
  restaurant_address text,
  total numeric,
  cod_amount numeric,
  delivery_fee numeric,
  placed_at timestamptz
)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_rider riders%rowtype;
begin
  select * into v_rider from riders where user_id = auth.uid();
  if not found or v_rider.status <> 'active' then
    raise exception 'Rider profile not active';
  end if;
  if not v_rider.is_online then
    return; -- offline riders see an empty pool
  end if;

  return query
    select o.id, r.name, r.address_text, o.total, o.cod_amount, o.delivery_fee, o.placed_at
      from orders o
      join restaurants r on r.id = o.restaurant_id
     where o.status = 'ready' and o.rider_id is null
     order by o.placed_at;
end;
$$;

-- Race-safe self-assignment: first rider wins, one active job at a time.
create or replace function public.rider_accept_order(p_order_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_rider riders%rowtype;
  v_updated int;
begin
  select * into v_rider from riders where user_id = auth.uid();
  if not found or v_rider.status <> 'active' then
    raise exception 'Rider profile not active';
  end if;
  if not v_rider.is_online then
    raise exception 'Go online to accept deliveries';
  end if;

  perform 1 from orders
   where rider_id = v_rider.id
     and status in ('assigned', 'picked_up', 'on_the_way');
  if found then
    raise exception 'Finish your current delivery first';
  end if;

  update orders
     set rider_id = v_rider.id, status = 'assigned'
   where id = p_order_id and status = 'ready' and rider_id is null;
  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'This order was already taken';
  end if;
end;
$$;

-- The rider's current delivery with pickup + drop-off details.
create or replace function public.rider_active_order()
returns table (
  order_id uuid,
  status order_status,
  restaurant_name text,
  restaurant_address text,
  restaurant_lat double precision,
  restaurant_lng double precision,
  total numeric,
  cod_amount numeric,
  delivery_fee numeric,
  address_label text,
  address_text text,
  landmark text,
  drop_lat double precision,
  drop_lng double precision,
  customer_name text,
  customer_phone text
)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_rider riders%rowtype;
begin
  select * into v_rider from riders where user_id = auth.uid();
  if not found then return; end if;

  return query
    select o.id, o.status, r.name, r.address_text, r.lat, r.lng,
           o.total, o.cod_amount, o.delivery_fee,
           a.label, a.address_text, a.landmark, a.lat, a.lng,
           u.full_name, u.phone
      from orders o
      join restaurants r on r.id = o.restaurant_id
      left join addresses a on a.id = o.address_id
      join users u on u.id = o.customer_id
     where o.rider_id = v_rider.id
       and o.status in ('assigned', 'picked_up', 'on_the_way')
     limit 1;
end;
$$;

-- assigned → picked_up → on_the_way → delivered.
-- Delivery closes the money loop: payment paid + COD ledger row
-- (rider keeps the delivery fee, owes the platform the rest).
create or replace function public.rider_update_status(
  p_order_id uuid,
  p_next order_status
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_rider riders%rowtype;
  v_order orders%rowtype;
begin
  select * into v_rider from riders where user_id = auth.uid();
  if not found or v_rider.status <> 'active' then
    raise exception 'Rider profile not active';
  end if;

  select * into v_order from orders
   where id = p_order_id and rider_id = v_rider.id
   for update;
  if not found then raise exception 'Order not found'; end if;

  if not (
    (v_order.status = 'assigned' and p_next = 'picked_up') or
    (v_order.status = 'picked_up' and p_next = 'on_the_way') or
    (v_order.status = 'on_the_way' and p_next = 'delivered')
  ) then
    raise exception 'Cannot move order from % to %', v_order.status, p_next;
  end if;

  update orders
     set status = p_next,
         picked_up_at = case when p_next = 'picked_up' then now() else picked_up_at end,
         delivered_at = case when p_next = 'delivered' then now() else delivered_at end
   where id = p_order_id;

  if p_next = 'delivered' then
    if v_order.payment_method = 'cod' then
      update payments set status = 'paid'
       where order_id = p_order_id and method = 'cod';

      update orders set payment_status = 'paid' where id = p_order_id;

      insert into cod_ledger (rider_id, order_id, amount_collected, amount_owed_to_platform)
      values (
        v_rider.id,
        p_order_id,
        coalesce(v_order.cod_amount, v_order.total),
        coalesce(v_order.cod_amount, v_order.total) - v_order.delivery_fee
      );
    end if;
  end if;
end;
$$;

revoke execute on function public.rider_available_orders() from public;
revoke execute on function public.rider_accept_order(uuid) from public;
revoke execute on function public.rider_active_order() from public;
revoke execute on function public.rider_update_status(uuid, order_status) from public;
grant execute on function public.rider_available_orders() to authenticated;
grant execute on function public.rider_accept_order(uuid) to authenticated;
grant execute on function public.rider_active_order() to authenticated;
grant execute on function public.rider_update_status(uuid, order_status) to authenticated;

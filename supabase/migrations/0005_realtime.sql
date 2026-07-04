-- =============================================================
-- Realtime: publish orders + riders changes over websockets.
-- Events respect RLS, so two read policies are added:
--   1. active riders can SELECT the ready/unassigned pool
--      (their app now gets live "new delivery" events)
--   2. customers can SELECT the rider row of their in-flight order
--      (live location on the tracking map)
-- Both use SECURITY DEFINER helpers instead of direct subqueries —
-- orders policies referencing riders and vice versa would otherwise
-- recurse (42P17).
-- =============================================================

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.riders;

create or replace function public.is_active_rider()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from riders where user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.rider_delivering_to_me(p_rider_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from orders o
     where o.rider_id = p_rider_id
       and o.customer_id = auth.uid()
       and o.status in ('assigned', 'picked_up', 'on_the_way')
  );
$$;

create policy "orders: active riders see ready pool" on orders
  for select using (
    status = 'ready' and rider_id is null and is_active_rider()
  );

create policy "riders: customer tracks own order rider" on riders
  for select using (rider_delivering_to_me(id));

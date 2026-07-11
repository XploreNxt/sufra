-- =============================================================
-- Referrals (voucher-based, no wallet).
--   users.referral_code    — each user's share code (auto-generated)
--   users.referred_by      — who referred this customer
--   users.referral_rewarded— referrer already got their reward
--   vouchers.user_id       — a personal voucher only that user can redeem
--
-- Friend applies a code → gets a Rs 150 welcome voucher + is marked
-- referred. When the friend's FIRST order is delivered, the referrer
-- gets a Rs 150 reward voucher. Both are personal (user-bound) vouchers.
-- =============================================================

alter table users
  add column referral_code text unique,
  add column referred_by uuid references users (id),
  add column referral_rewarded boolean not null default false;

alter table vouchers
  add column user_id uuid references users (id) on delete cascade;

-- A customer can see their own personal vouchers (reward/welcome codes).
create policy "vouchers: read own" on vouchers
  for select using (user_id = auth.uid());

-- Short uppercase code helper.
create or replace function public.gen_code(p_len int default 6)
returns text language sql as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, p_len));
$$;

-- Give every new user a referral code.
create or replace function public.set_referral_code()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.referral_code is null then
    loop
      new.referral_code := public.gen_code(6);
      exit when not exists (select 1 from users where referral_code = new.referral_code);
    end loop;
  end if;
  return new;
end $$;

create trigger users_set_referral_code
  before insert on public.users
  for each row execute function public.set_referral_code();

-- Backfill existing users.
do $$
declare u record; c text;
begin
  for u in select id from users where referral_code is null loop
    loop c := public.gen_code(6); exit when not exists (select 1 from users where referral_code = c); end loop;
    update users set referral_code = c where id = u.id;
  end loop;
end $$;

-- Voucher validation now also honours user-bound (personal) vouchers.
create or replace function public.compute_voucher_discount(
  p_code text, p_subtotal numeric, p_restaurant uuid, p_lock boolean
) returns table (voucher_id uuid, discount numeric)
language plpgsql security definer set search_path = public
as $$
declare v vouchers%rowtype;
begin
  if p_lock then
    select * into v from vouchers where upper(code) = upper(trim(p_code)) for update;
  else
    select * into v from vouchers where upper(code) = upper(trim(p_code));
  end if;
  if not found or not v.is_active then raise exception 'Invalid voucher code'; end if;
  if v.user_id is not null and v.user_id <> auth.uid() then
    raise exception 'This code is not valid for your account';
  end if;
  if v.restaurant_id is not null and v.restaurant_id <> p_restaurant then
    raise exception 'This code is not valid at this restaurant';
  end if;
  if v.valid_from is not null and now() < v.valid_from then raise exception 'This voucher is not active yet'; end if;
  if v.valid_to is not null and now() > v.valid_to then raise exception 'This voucher has expired'; end if;
  if v.usage_limit is not null and v.times_used >= v.usage_limit then raise exception 'This voucher has been fully redeemed'; end if;
  if p_subtotal < v.min_order then raise exception 'Voucher needs a minimum order of Rs %', v.min_order::text; end if;
  discount := case v.discount_type when 'percent' then round(p_subtotal * v.value / 100, 2) else v.value end;
  if v.max_discount is not null then discount := least(discount, v.max_discount); end if;
  discount := least(discount, p_subtotal);
  voucher_id := v.id;
  return next;
end $$;

-- A new customer applies a friend's code: link + issue a welcome voucher.
create or replace function public.apply_referral_code(p_code text)
returns text language plpgsql security definer set search_path = public
as $$
declare v_me uuid := auth.uid(); v_ref uuid; v_code text;
begin
  if v_me is null then raise exception 'Please sign in'; end if;
  if exists (select 1 from users where id = v_me and referred_by is not null) then
    raise exception 'You have already used a referral code';
  end if;
  if exists (select 1 from orders where customer_id = v_me) then
    raise exception 'Referral codes are for new customers only';
  end if;
  select id into v_ref from users where upper(referral_code) = upper(trim(p_code));
  if v_ref is null then raise exception 'Invalid referral code'; end if;
  if v_ref = v_me then raise exception 'You cannot use your own code'; end if;

  update users set referred_by = v_ref where id = v_me;
  loop v_code := 'WEL' || public.gen_code(5); exit when not exists (select 1 from vouchers where upper(code) = upper(v_code)); end loop;
  insert into vouchers (code, discount_type, value, min_order, usage_limit, is_active, user_id)
  values (v_code, 'fixed', 150, 500, 1, true, v_me);
  return v_code;
end $$;
grant execute on function public.apply_referral_code(text) to authenticated;

-- Reward the referrer when the referred customer's FIRST order is delivered.
create or replace function public.reward_referrer()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_ref uuid; v_code text;
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    select referred_by into v_ref from users
      where id = new.customer_id and referred_by is not null and not referral_rewarded;
    if v_ref is not null
       and (select count(*) from orders where customer_id = new.customer_id and status = 'delivered') = 1 then
      loop v_code := 'REF' || public.gen_code(5); exit when not exists (select 1 from vouchers where upper(code) = upper(v_code)); end loop;
      insert into vouchers (code, discount_type, value, min_order, usage_limit, is_active, user_id)
      values (v_code, 'fixed', 150, 500, 1, true, v_ref);
      update users set referral_rewarded = true where id = new.customer_id;
    end if;
  end if;
  return new;
end $$;

create trigger orders_reward_referrer
  after update on orders
  for each row execute function public.reward_referrer();

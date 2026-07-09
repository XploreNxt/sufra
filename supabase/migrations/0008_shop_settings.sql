-- =============================================================
-- Vendor shop settings: editable timings (instant) + logo/cover
-- image changes that need admin approval (staged so the live
-- branding stays visible during review). Name/address are locked.
-- =============================================================

alter table restaurants
  add column pending_logo_url text,
  add column pending_cover_url text,
  add column branding_rejection_reason text,
  add column hours jsonb;

-- Re-scope the vendor update policy: on top of not changing status or
-- commission, vendors can no longer change name or address either.
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
  );

# Food Delivery Marketplace

A multi-vendor food delivery platform for the Pakistani market (web-only MVP).
Four sides in one Next.js app: **Customer**, **Vendor**, **Rider**, **Admin**.

Built phase-by-phase from `food-delivery-build-blueprint.md`. Phases 0–7 and 9
are complete; Phase 8 (JazzCash/Easypaisa) is pending provider credentials.

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind 4**
- **Supabase**: PostgreSQL, Auth, Realtime, RLS
- Money paths (order creation, delivery completion, vouchers) run inside
  Postgres functions — atomic, server-priced, RLS-safe

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
```

`.env.local` needs the Supabase project URL + keys (see `.env.example`).
Database schema lives in `supabase/migrations/` (run in order in the
Supabase SQL editor).

### Test accounts (password: `Test1234!`)

| Email | Role | Landing |
|---|---|---|
| customer@test.com | customer | `/` browse → cart → checkout → track |
| vendor@test.com | vendor | `/vendor` orders, menu, earnings |
| rider@test.com | rider | `/rider` deliveries, COD ledger |
| admin@test.com | admin | `/admin` approvals, monitor, settlement |

### Seed scripts

```bash
node scripts/seed-users.mjs        # the 4 test accounts
node scripts/seed-restaurants.mjs  # 3 restaurants w/ menus + modifiers
node scripts/seed-rider.mjs        # active rider profile
```

## What works end to end

1. Customer browses (Roman-Urdu-tolerant search), builds a cart with item
   options, applies a voucher, orders COD to an address with landmark + pin.
2. Vendor accepts → preparing → ready (live queue, menu CRUD, open/close,
   earnings minus commission).
3. Rider goes online, self-assigns, navigates via Google Maps deep link,
   collects cash — COD ledger tracks what they keep vs. owe.
4. Admin approves vendors/riders, monitors orders live, reassigns/cancels,
   sets commission, manages vouchers, settles rider cash.
5. Everything updates in real time (Supabase Realtime + polling fallback);
   customers see the rider moving on a map.
6. Delivered orders can be rated — restaurant averages update automatically.

## Deferred

- **Phase 8**: JazzCash / Easypaisa (needs merchant sandbox credentials)
- Phone OTP login UI exists; enable the Supabase phone provider + SMS
  provider to activate (email/password is the dev auth)
- Push/SMS notifications, proof-of-delivery photos, surge pricing, referrals

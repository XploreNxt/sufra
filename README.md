# Sufra — Food Delivery Marketplace

A multi-vendor food delivery platform for the Pakistani market (web MVP).
Four sides in one Next.js app: **Customer**, **Vendor**, **Rider**, **Admin**.

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind 4** — built with Webpack
  (`next dev --webpack`), not Turbopack.
- **Supabase**: PostgreSQL, Auth, Realtime, RLS, Storage.
- Money paths (order pricing, delivery completion, vouchers, referral rewards)
  run inside Postgres functions — atomic, server-priced, RLS-safe.
- **Maps/geocoding**: Leaflet + OpenStreetMap tiles + Nominatim (all free, no
  API key). Swap to a keyed provider for production — geocoding is isolated in
  `app/actions/geocode.ts`, tiles in `components/map-picker.tsx`.

## Features

- **Location-first discovery** — customer sets a delivery location (locate-me /
  search / draggable pin); the feed shows only restaurants whose delivery
  radius covers them, sorted by distance.
- **Distance-based delivery fee** — Rs 50 base + Rs 20/km, rider keeps 95%.
- **Vendor**: approved location pin + delivery radius (≤25 km), self-serve
  cuisines & spice levels, menu CRUD (admin-approved), promos, offers/bundles,
  earnings, **check-in to open** with automatic close at closing time.
- **Orders**: placed → vendor **accepts** to confirm → preparing → ready →
  rider self-assign → delivered; live new-order bell + popup for vendors.
- **Customer profile**: edit details, saved address book, favourites, one-tap
  reorder, spice/cuisine preferences, email-OTP password change.
- **Referrals** (voucher-based) and **web push** notifications.
- Real-time updates throughout (Supabase Realtime + polling fallback).

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev                  # http://localhost:3000
```

- Fill `.env.local` from `.env.example` (Supabase keys + VAPID keys).
- Apply the schema: run every file in `supabase/migrations/` **in order** in the
  Supabase SQL editor (0001 → 0019).
- Portals are subdomain-scoped: `vendor.localhost:3000`, `rider.localhost:3000`,
  `admin.localhost:3000` (plain `localhost` is the customer app).

### Seed data (test accounts use password `Test1234!`)

```bash
node scripts/seed-users.mjs        # customer/vendor/rider/admin @test.com
node scripts/seed-restaurants.mjs  # restaurants + menus + modifiers
node scripts/reassign-vendors.mjs  # one login per restaurant
node scripts/seed-rider.mjs        # active rider profile
```

| Email | Role |
|---|---|
| customer@test.com | customer |
| cheezy@test.com / karachi@test.com / lahori@test.com | vendors |
| rider@test.com | rider |
| admin@test.com | admin |

`scripts/verify-*.mjs` are one-off end-to-end checks used during development
(they read `.env.local`).

## Deferred / production notes

- **Payments**: COD only; JazzCash/Easypaisa need merchant credentials.
- **Geocoding/tiles**: on free OSM services (rate-limited) — move to Google
  Places / Mapbox for launch.
- **Email/SMS**: password-change OTP needs real SMTP; test `@test.com` accounts
  can't receive mail. Web push needs HTTPS + the VAPID keys set.

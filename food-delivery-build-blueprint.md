# Food Delivery Marketplace — Build Blueprint

A web-based, multi-vendor food delivery platform for the Pakistani market (a Foodpanda-style competitor). This document is the single source of truth to carry into Claude Code. Work through it phase by phase.

---

## 1. Locked Decisions

| Area | Decision |
|---|---|
| Product | Multi-vendor food delivery marketplace |
| Market | Pakistan (single city for MVP) |
| Platform | Web only |
| Frontend | Next.js (React) + Tailwind CSS |
| Backend | Next.js API routes / server actions |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth — phone + OTP primary |
| Real-time | Supabase Realtime (order status, rider location) |
| File storage | Supabase Storage (menu / restaurant images) |

The whole stack is JavaScript end to end, which keeps the number of moving parts low and makes it easy for Claude Code to scaffold.

---

## 2. The Four Sides (recap)

1. **Customer** — browse, order, pay, track.
2. **Vendor (restaurant)** — accept orders, manage menu, toggle open/closed.
3. **Rider** — receive assignments, navigate, mark delivered, reconcile COD cash.
4. **Admin** — approve vendors/riders, monitor orders, set fees/commission, handle payouts and disputes.

All four are web interfaces in the same Next.js project, separated by role and route group.

---

## 3. MVP Scope Cut

Build version one small enough to actually ship. The goal of the MVP is **one working end-to-end order**: a customer orders → restaurant accepts → rider delivers → COD is reconciled.

**In scope for v1**
- Phone/OTP auth for all roles
- Customer: discovery, restaurant page, menu, cart, checkout (COD + one wallet), order tracking, order history
- Vendor: onboarding, order accept/reject + status updates, menu CRUD, open/close toggle, basic earnings
- Rider: onboarding, online/offline, order assignment, navigation link, status updates, COD ledger
- Admin: approve vendors/riders, live order monitor, manual reassign/refund, commission + delivery-fee config, payouts, basic analytics
- Real-time order status + rider location
- Ratings & reviews (basic)

**Deferred to later versions**
- Scheduled ("order for later") orders
- In-app wallet / loyalty points
- Surge / peak pricing
- Referral engine
- Advanced analytics dashboards
- Vendor-funded promotions
- Proof-of-delivery photos, tiered rider incentives

---

## 4. Database Schema

PostgreSQL. This is the backbone — get it right before building screens. Money-handling tables (orders, payments, cod_ledger) rely on ACID transactions, which is exactly why we chose SQL over NoSQL.

### Identity & location
- **users** — `id, phone, email, full_name, role (customer|vendor|rider|admin), created_at`
- **addresses** — `id, user_id → users, label, address_text, landmark, lat, lng, city, is_default`

> Note on addressing: `lat/lng` (map pin) + `landmark` are the real navigation data in Pakistan. `address_text` is secondary.

### Restaurants & menu
- **restaurants** — `id, owner_user_id → users, name, description, cuisine_types[], logo_url, cover_url, address_text, lat, lng, phone, commission_rate, min_order, delivery_fee, default_prep_minutes, status (pending|active|suspended), is_open, rating_avg, created_at`
- **menu_categories** — `id, restaurant_id → restaurants, name, sort_order`
- **menu_items** — `id, restaurant_id → restaurants, category_id → menu_categories, name, description, price, image_url, is_available, sort_order`
- **modifier_groups** — `id, menu_item_id → menu_items, name, min_select, max_select, is_required`
- **modifiers** — `id, group_id → modifier_groups, name, price_delta`

### Orders (the core)
- **orders** — `id, customer_id → users, restaurant_id → restaurants, rider_id → riders, address_id → addresses, status, subtotal, delivery_fee, tax, discount, total, payment_method, payment_status, cod_amount, voucher_id, placed_at, accepted_at, ready_at, picked_up_at, delivered_at`
  - `status`: `pending → accepted → preparing → ready → assigned → picked_up → on_the_way → delivered` (plus `rejected`, `cancelled`)
- **order_items** — `id, order_id → orders, menu_item_id, name_snapshot, price_snapshot, quantity, special_instructions`
- **order_item_modifiers** — `id, order_item_id → order_items, name_snapshot, price_snapshot`

> Snapshot the name/price at order time. If a restaurant later edits its menu, past orders must stay accurate.

### Riders & money
- **riders** — `id, user_id → users, vehicle_type, cnic, license_no, status (pending|active|suspended), is_online, current_lat, current_lng, zone_id → zones`
- **payments** — `id, order_id → orders, method, amount, provider (jazzcash|easypaisa|card|cod), provider_ref, status, created_at`
- **cod_ledger** — `id, rider_id → riders, order_id → orders, amount_collected, amount_owed_to_platform, is_settled, settled_at`

> The COD ledger is the operational heart of a cash-first market. Every cash order creates a ledger row tracking what the rider collected vs. what they owe the platform after their cut.

### Supporting
- **zones** — `id, name, city, delivery_fee, bounds` (per-area delivery pricing + dispatch)
- **vouchers** — `id, code, discount_type (percent|fixed), value, min_order, max_discount, valid_from, valid_to, usage_limit, times_used, is_active`
- **reviews** — `id, order_id → orders, customer_id, restaurant_id, rider_id, restaurant_rating, rider_rating, comment, created_at`

---

## 5. Project Structure (Next.js App Router)

```
/app
  /(customer)        → customer-facing pages (home, restaurant, cart, checkout, track, orders)
  /(vendor)          → restaurant dashboard (orders, menu, earnings, settings)
  /(rider)           → rider app (available orders, active delivery, earnings, cod)
  /(admin)           → admin panel (vendors, riders, orders, finance, analytics)
  /api               → API routes / server actions (or use server actions directly)
/components          → shared UI (buttons, cards, maps, order-status)
/lib
  /supabase          → client + server Supabase setup
  /auth              → role guards, session helpers
  /db                → query helpers per domain
/types               → shared TypeScript types
```

Each route group is gated by role so a customer can't reach `/vendor` and so on.

---

## 6. Build Order (step by step)

Work top to bottom. Don't start a phase until the previous one runs.

**Phase 0 — Setup**
- Create Next.js project (TypeScript, Tailwind, App Router).
- Create a Supabase project; wire environment variables.
- Initialize git repo.

**Phase 1 — Database & auth**
- Write the schema from Section 4 as SQL migrations in Supabase.
- Set up Row Level Security so each role only sees its own data.
- Implement phone + OTP login and role-based redirect after login.

**Phase 2 — Customer discovery (read path first)**
- Seed a few test restaurants + menus.
- Build home feed, restaurant page, menu display. Read-only — proves data flows before any writes.

**Phase 3 — Cart & checkout (first write path)**
- Cart state, address selection (map pin + landmark), order creation.
- COD only at this stage. This is your first end-to-end order in the database.

**Phase 4 — Vendor dashboard**
- Order queue with accept/reject + status updates.
- Menu CRUD, open/close toggle, basic earnings.
- Now a real order can move from placed → accepted → ready.

**Phase 5 — Rider app**
- Online/offline, order assignment (start with manual/admin assign, add proximity auto-dispatch later).
- Status updates, navigation link (Google Maps deep link), COD ledger entry on delivery.
- Order can now reach `delivered`. **End-to-end flow complete.**

**Phase 6 — Admin panel**
- Vendor/rider approval, live order monitor, manual reassign/refund.
- Commission + delivery-fee config, payouts, COD reconciliation view, basic analytics.

**Phase 7 — Real-time**
- Supabase Realtime for live order status (all dashboards) and rider location on the customer tracking map.

**Phase 8 — Digital payments**
- Integrate JazzCash / Easypaisa (and card if desired) alongside COD.
- Wire `payments` table + provider callbacks.

**Phase 9 — Polish**
- Notifications (push/SMS), reviews, vouchers, error states, Roman-Urdu-tolerant search, mobile-web performance for low-end Android.

---

## 7. Key Flows to Get Right

**Order lifecycle** — Every status change writes a timestamp and (in later phases) fires a real-time event so all four sides stay in sync. Treat `orders.status` as the single source of truth.

**Dispatch** — MVP can assign riders manually from the admin panel. Later, auto-assign to the nearest online rider in the order's zone using `riders.current_lat/lng` and `zones`.

**COD reconciliation** — On a cash delivery: create a `cod_ledger` row (collected vs. owed), mark the `payment` paid, and the order delivered. Admin later settles the rider's outstanding cash and flips `is_settled`.

---

## 8. Pakistan-Specific Implementation Notes

- **Payments:** COD is the default and dominant method — build it as a first-class flow, not an afterthought. Add JazzCash + Easypaisa before cards.
- **Addressing:** Map pin + landmark + phone beats formal addresses. Make the pin the primary input at checkout.
- **Language:** Urdu + English UI; search must tolerate Roman Urdu spellings.
- **Devices:** Android-dominant, many low-end phones, patchy networks — keep the web app lightweight and resilient to flaky connections.

---

## 9. Handoff to Claude Code

Start Claude Code in an empty project folder and give it this file as context. Suggested first prompt:

> "Read `food-delivery-build-blueprint.md`. Execute Phase 0 and Phase 1: scaffold a Next.js + Tailwind + TypeScript app, set up Supabase, and create the database schema and RLS from Section 4. Stop after Phase 1 so I can verify auth works before we continue."

Then move phase by phase, verifying each one runs before advancing. Don't let it build all four sides at once — the vertical slice (Phases 2→5) that produces one working end-to-end order is the real milestone.

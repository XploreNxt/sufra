# Setup — Phase 0 & 1 verification

## 1. Create the Supabase project

1. Go to [database.new](https://database.new) and create a project (any region; `ap-southeast-1` Singapore is closest to Pakistan).
2. In **Settings → API**, copy the values into `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Run the migrations

In the Supabase Dashboard → **SQL Editor**, run these two files **in order**:

1. `supabase/migrations/0001_schema.sql` — tables, enums, indexes, signup trigger
2. `supabase/migrations/0002_rls.sql` — Row Level Security policies

(Or, with the Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`.)

## 3. Enable phone auth

In the Dashboard → **Authentication → Sign In / Up → Phone**:

1. Enable the **Phone** provider.
2. **For development, you don't need an SMS provider.** Scroll to **Test phone numbers** (Authentication → Sign In / Up → Phone) and add e.g.:
   - Phone: `+923001234567`, OTP: `123456`
   You can then log in with that number and code without any SMS being sent.
3. For real SMS later, connect Twilio / MessageBird / Vonage under **Auth → Providers → Phone → SMS provider**.

## 4. Run the app

```bash
npm run dev
```

Open http://localhost:3000 and verify:

- [ ] Home page shows **Sign in with phone**
- [ ] `/login` — enter the test number `03001234567`, then code `123456`
- [ ] After login you land on `/` showing your phone and role `customer`
- [ ] The row exists in Supabase → Table Editor → `users` (created by trigger)
- [ ] Visiting `/vendor`, `/rider`, `/admin` as a customer bounces you back to `/`
- [ ] In Table Editor, change your `users.role` to `admin` → sign out, sign back in → `/admin` now loads (admin can also open `/vendor` and `/rider`)
- [ ] **Sign out** returns you to `/login`

When all boxes pass, Phase 1 is verified and we move to Phase 2 (seed restaurants + customer discovery).

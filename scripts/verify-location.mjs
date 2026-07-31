import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const svc = createClient(URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Snapshot original state so we can restore it.
  const { data: before } = await svc
    .from("restaurants")
    .select("id, lat, lng, delivery_radius_km, pending_lat, pending_lng, location_rejection_reason")
    .eq("name", "Cheezy Bites")
    .single();
  const rid = before.id;
  console.log("BEFORE", JSON.stringify(before));

  const vendor = createClient(URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const auth = await vendor.auth.signInWithPassword({
    email: "cheezy@test.com",
    password: "Test1234!",
  });
  if (auth.error) return console.log("SIGNIN_ERR " + auth.error.message);

  // A) Radius change (instant) — should succeed.
  const a = await vendor.from("restaurants").update({ delivery_radius_km: 12 }).eq("id", rid).select("delivery_radius_km");
  console.log("A radius->12:", a.error ? "ERR " + a.error.message : JSON.stringify(a.data));

  // B) Stage a pending pin — should succeed.
  const b = await vendor
    .from("restaurants")
    .update({ pending_lat: 24.9, pending_lng: 67.1, location_rejection_reason: null })
    .eq("id", rid)
    .select("pending_lat, pending_lng");
  console.log("B stage pending pin:", b.error ? "ERR " + b.error.message : JSON.stringify(b.data));

  // C) Direct lat/lng change — should be BLOCKED by RLS.
  const c = await vendor
    .from("restaurants")
    .update({ lat: 24.95, lng: 67.15 })
    .eq("id", rid)
    .select("lat, lng");
  console.log(
    "C direct lat/lng (expect blocked):",
    c.error ? "BLOCKED (" + c.error.message + ")" : "NOT BLOCKED -> " + JSON.stringify(c.data)
  );

  // Confirm the live pin did NOT move.
  const { data: mid } = await svc.from("restaurants").select("lat, lng, pending_lat, pending_lng, delivery_radius_km").eq("id", rid).single();
  console.log("AFTER-VENDOR", JSON.stringify(mid));

  // D) Admin approval (service role stands in for the admin action): apply pending → live.
  await svc
    .from("restaurants")
    .update({ lat: mid.pending_lat, lng: mid.pending_lng, pending_lat: null, pending_lng: null, location_rejection_reason: null })
    .eq("id", rid);
  const { data: approved } = await svc.from("restaurants").select("lat, lng, pending_lat").eq("id", rid).single();
  console.log("D after approve:", JSON.stringify(approved));

  // Restore original state.
  await svc
    .from("restaurants")
    .update({
      lat: before.lat,
      lng: before.lng,
      delivery_radius_km: before.delivery_radius_km,
      pending_lat: before.pending_lat,
      pending_lng: before.pending_lng,
      location_rejection_reason: before.location_rejection_reason,
    })
    .eq("id", rid);
  const { data: restored } = await svc.from("restaurants").select("lat, lng, delivery_radius_km, pending_lat").eq("id", rid).single();
  console.log("RESTORED", JSON.stringify(restored));
  console.log("DONE");
}

main().catch((e) => console.log("SCRIPT_ERR " + e.message));

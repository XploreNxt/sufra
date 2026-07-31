import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/).filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const svc = createClient(URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = () => createClient(URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function haversineKm(la1, ln1, la2, ln2) {
  const R = 6371, dLat = (la2 - la1) * Math.PI / 180, dLng = (ln2 - ln1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
async function purgeOrder(oid) {
  await svc.from("cod_ledger").delete().eq("order_id", oid);
  await svc.from("payments").delete().eq("order_id", oid);
  await svc.from("orders").delete().eq("id", oid);
}

async function main() {
  const { data: custUser } = await svc.from("users").select("id").eq("email", "customer@test.com").single();
  // Clean up any leftover "Test" addresses + their orders from prior runs.
  const { data: stale } = await svc.from("addresses").select("id").eq("user_id", custUser.id).eq("address_text", "Test");
  for (const a of stale ?? []) {
    const { data: os } = await svc.from("orders").select("id").eq("address_id", a.id);
    for (const o of os ?? []) await purgeOrder(o.id);
    await svc.from("addresses").delete().eq("id", a.id);
  }

  const { data: rest } = await svc.from("restaurants").select("id, is_open, lat, lng").eq("name", "Karachi Biryani House").single();
  const wasOpen = rest.is_open;
  if (!wasOpen) await svc.from("restaurants").update({ is_open: true }).eq("id", rest.id);

  const cust = anon();
  await cust.auth.signInWithPassword({ email: "customer@test.com", password: "Test1234!" });
  const aLat = 24.92, aLng = 67.0971;
  const { data: addr } = await svc.from("addresses").insert({ user_id: custUser.id, label: "Home", address_text: "Test", city: "Karachi", lat: aLat, lng: aLng }).select("id").single();

  const dist = haversineKm(rest.lat, rest.lng, aLat, aLng);
  const expectedFee = 50 + Math.round(20 * dist);

  const { data: item } = await svc.from("menu_items").select("id").eq("restaurant_id", rest.id).eq("name", "Chicken Biryani").single();
  const { data: oid } = await cust.rpc("place_order", { p_restaurant_id: rest.id, p_address_id: addr.id, p_items: [{ menu_item_id: item.id, quantity: 1 }], p_voucher_code: null, p_bundles: [] });
  const { data: o } = await svc.from("orders").select("delivery_fee, total").eq("id", oid).single();
  console.log(`distance=${dist.toFixed(2)}km expectedFee=Rs ${expectedFee} | order fee=Rs ${o.delivery_fee} match=${Number(o.delivery_fee) === expectedFee} | total=${o.total}`);

  // Rider flow via rider@test.com.
  const { data: ru } = await svc.from("users").select("id").eq("email", "rider@test.com").single();
  const { data: riderRow } = await svc.from("riders").select("id, status, is_online").eq("user_id", ru.id).single();
  await svc.from("riders").update({ status: "active", is_online: true }).eq("id", riderRow.id);
  await svc.from("orders").update({ status: "ready" }).eq("id", oid);

  const rc = anon();
  const rs = await rc.auth.signInWithPassword({ email: "rider@test.com", password: "Test1234!" });
  if (rs.error) console.log("RIDER_SIGNIN_ERR " + rs.error.message);
  const acc = await rc.rpc("rider_accept_order", { p_order_id: oid });
  if (acc.error) console.log("ACCEPT_ERR " + acc.error.message);
  for (const s of ["picked_up", "on_the_way", "delivered"]) {
    const u = await rc.rpc("rider_update_status", { p_order_id: oid, p_next: s });
    if (u.error) console.log(`STATUS ${s} ERR ` + u.error.message);
  }
  const { data: led } = await svc.from("cod_ledger").select("amount_collected, amount_owed_to_platform").eq("order_id", oid).maybeSingle();
  if (led) {
    const riderKeeps = Number(led.amount_collected) - Number(led.amount_owed_to_platform);
    const expected = Math.round(expectedFee * 0.95 * 100) / 100;
    console.log(`LEDGER collected=${led.amount_collected} owed=${led.amount_owed_to_platform} | rider keeps=Rs ${riderKeeps} (expected 95% = Rs ${expected}) match=${riderKeeps === expected}`);
  } else console.log("NO LEDGER ROW");

  await purgeOrder(oid);
  await svc.from("addresses").delete().eq("id", addr.id);
  await svc.from("riders").update({ status: riderRow.status, is_online: riderRow.is_online }).eq("id", riderRow.id);
  if (!wasOpen) await svc.from("restaurants").update({ is_open: false }).eq("id", rest.id);
  console.log("DONE cleaned up");
}
main().catch((e) => console.log("SCRIPT_ERR " + e.message));

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
const svc = createClient(URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  // --- Vendor shop profile: set spice + cuisines on Karachi Biryani House ---
  const { data: rest } = await svc.from("restaurants")
    .select("id, is_open, spice_levels, cuisine_types").eq("name", "Karachi Biryani House").single();
  const orig = { is_open: rest.is_open, spice_levels: rest.spice_levels, cuisine_types: rest.cuisine_types };
  await svc.from("restaurants").update({ is_open: true, spice_levels: ["mild","medium","hot"], cuisine_types: ["Biryani","Desi"] }).eq("id", rest.id);

  const { data: item } = await svc.from("menu_items").select("id").eq("restaurant_id", rest.id).eq("name", "Chicken Biryani").single();

  // --- Customer preferences (RLS: update own users row) ---
  const cust = createClient(URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const a = await cust.auth.signInWithPassword({ email: "customer@test.com", password: "Test1234!" });
  const uid = a.data.user.id;
  const { data: pbefore } = await cust.from("users").select("default_spice, favorite_cuisines, notify_order_updates, notify_promotions").eq("id", uid).single();
  const pu = await cust.from("users").update({
    default_spice: "medium", favorite_cuisines: ["Biryani","BBQ"], notify_order_updates: true, notify_promotions: false,
  }).eq("id", uid).select("default_spice, favorite_cuisines, notify_promotions");
  console.log("PREFS update:", pu.error ? "ERR " + pu.error.message : JSON.stringify(pu.data));

  // --- Order with spice ---
  const { data: addr } = await cust.from("addresses").select("id").limit(1).single();
  const { data: oid, error: oe } = await cust.rpc("place_order", {
    p_restaurant_id: rest.id, p_address_id: addr.id,
    p_items: [{ menu_item_id: item.id, quantity: 1, spice_level: "hot" }], p_voucher_code: null, p_bundles: [],
  });
  if (oe) console.log("PLACE_ORDER_ERR " + oe.message);
  else {
    const { data: oi } = await svc.from("order_items").select("name_snapshot, spice_level").eq("order_id", oid);
    console.log("ORDER spice stored:", JSON.stringify(oi));
    await svc.from("orders").delete().eq("id", oid);
  }

  // --- Restore ---
  await cust.from("users").update(pbefore).eq("id", uid);
  await svc.from("restaurants").update(orig).eq("id", rest.id);
  console.log("DONE cleaned up");
}
main().catch((e) => console.log("SCRIPT_ERR " + e.message));

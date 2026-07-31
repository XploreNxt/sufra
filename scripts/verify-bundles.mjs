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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  let visible = false;
  for (let i = 0; i < 660; i++) {
    const { error } = await svc.from("bundles").select("id").limit(1);
    if (!error) {
      visible = true;
      console.log("CACHE_CLEARED after ~" + Math.round((i * 5) / 60) + "min");
      break;
    }
    await sleep(5000);
  }
  if (!visible) {
    console.log("CACHE_TIMEOUT still not visible after ~55min");
    return;
  }

  const { data: rest } = await svc
    .from("restaurants")
    .select("id, is_open")
    .eq("name", "Karachi Biryani House")
    .single();
  const wasOpen = rest.is_open;
  if (!wasOpen) await svc.from("restaurants").update({ is_open: true }).eq("id", rest.id);

  const { data: biryani } = await svc
    .from("menu_items").select("id").eq("restaurant_id", rest.id).eq("name", "Chicken Biryani").single();
  const { data: drink } = await svc
    .from("menu_items").select("id").eq("restaurant_id", rest.id).eq("name", "Soft Drink (Can)").single();

  const { data: bundle, error: be } = await svc
    .from("bundles")
    .insert({ restaurant_id: rest.id, name: "Verify Combo", price: 800, is_active: true })
    .select("id").single();
  if (be) { console.log("BUNDLE_INSERT_ERR " + be.message); return; }
  await svc.from("bundle_items").insert([
    { bundle_id: bundle.id, menu_item_id: biryani.id, quantity: 1 },
    { bundle_id: bundle.id, menu_item_id: drink.id, quantity: 2 },
  ]);

  const cust = createClient(URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  await cust.auth.signInWithPassword({ email: "customer@test.com", password: "Test1234!" });
  const { data: addr } = await cust.from("addresses").select("id").limit(1).single();
  const { data: oid, error: oe } = await cust.rpc("place_order", {
    p_restaurant_id: rest.id, p_address_id: addr.id, p_items: [], p_voucher_code: null,
    p_bundles: [{ bundle_id: bundle.id, quantity: 1 }],
  });

  if (oe) {
    console.log("PLACE_ORDER_ERR " + oe.message);
  } else {
    const { data: oi } = await svc
      .from("order_items")
      .select("name_snapshot, price_snapshot, quantity, menu_item_id, order_item_modifiers(name_snapshot)")
      .eq("order_id", oid);
    const { data: o } = await svc.from("orders").select("subtotal,total").eq("id", oid).single();
    console.log("ORDER_OK " + JSON.stringify({ order: o, lines: oi }));
    await svc.from("orders").delete().eq("id", oid);
  }

  await svc.from("bundles").delete().eq("id", bundle.id);
  if (!wasOpen) await svc.from("restaurants").update({ is_open: false }).eq("id", rest.id);
  console.log("DONE cleaned up");
}

main().catch((e) => console.log("SCRIPT_ERR " + e.message));

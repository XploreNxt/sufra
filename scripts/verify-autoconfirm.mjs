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
  const { data: rest } = await svc
    .from("restaurants").select("id, is_open").eq("name", "Karachi Biryani House").single();
  const wasOpen = rest.is_open;
  if (!wasOpen) await svc.from("restaurants").update({ is_open: true }).eq("id", rest.id);

  const { data: item } = await svc
    .from("menu_items").select("id").eq("restaurant_id", rest.id).eq("name", "Chicken Biryani").single();

  const cust = createClient(URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  await cust.auth.signInWithPassword({ email: "customer@test.com", password: "Test1234!" });
  const { data: addr } = await cust.from("addresses").select("id").limit(1).single();

  const { data: oid, error: oe } = await cust.rpc("place_order", {
    p_restaurant_id: rest.id, p_address_id: addr.id,
    p_items: [{ menu_item_id: item.id, quantity: 1 }], p_voucher_code: null, p_bundles: [],
  });
  if (oe) { console.log("PLACE_ORDER_ERR " + oe.message); return; }

  const { data: o1 } = await svc
    .from("orders").select("status, accepted_at, acknowledged_at").eq("id", oid).single();
  console.log("AFTER_PLACE:", JSON.stringify(o1),
    "=> auto-confirmed:", o1.status === "accepted" && o1.accepted_at != null && o1.acknowledged_at == null);

  // Vendor acknowledges (RLS must allow the owner to stamp acknowledged_at).
  const vendor = createClient(URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  await vendor.auth.signInWithPassword({ email: "karachi@test.com", password: "Test1234!" });
  const ack = await vendor.from("orders")
    .update({ acknowledged_at: new Date().toISOString() })
    .eq("id", oid).is("acknowledged_at", null).select("acknowledged_at");
  console.log("ACK:", ack.error ? "ERR " + ack.error.message : JSON.stringify(ack.data));

  const { data: o2 } = await svc.from("orders").select("acknowledged_at").eq("id", oid).single();
  console.log("AFTER_ACK acknowledged_at set:", o2.acknowledged_at != null);

  await svc.from("orders").delete().eq("id", oid);
  if (!wasOpen) await svc.from("restaurants").update({ is_open: false }).eq("id", rest.id);
  console.log("DONE cleaned up");
}

main().catch((e) => console.log("SCRIPT_ERR " + e.message));

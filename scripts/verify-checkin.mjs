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

async function main() {
  const { data: r0 } = await svc.from("restaurants").select("id, is_open, open_until, checked_in_at").eq("name", "Karachi Biryani House").single();
  const rid = r0.id;
  const past = new Date(Date.now() - 60 * 1000).toISOString();
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  // 1) Auto-close sweep: open with an expired window → close_expired_shops closes it.
  await svc.from("restaurants").update({ is_open: true, open_until: past }).eq("id", rid);
  await svc.rpc("close_expired_shops");
  const { data: a } = await svc.from("restaurants").select("is_open, open_until").eq("id", rid).single();
  console.log("auto-close: is_open", a.is_open, "open_until", a.open_until, "=>", a.is_open === false && a.open_until === null ? "CLOSED ✓" : "FAIL");

  // Prepare customer + order inputs.
  const c = createClient(URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  await c.auth.signInWithPassword({ email: "customer@test.com", password: "Test1234!" });
  const { data: addr } = await c.from("addresses").select("id").limit(1).single();
  const { data: item } = await svc.from("menu_items").select("id").eq("restaurant_id", rid).eq("name", "Chicken Biryani").single();
  const place = () => c.rpc("place_order", { p_restaurant_id: rid, p_address_id: addr.id, p_items: [{ menu_item_id: item.id, quantity: 1 }], p_voucher_code: null, p_bundles: [] });

  // 2) place_order rejects when open_until has passed (even if is_open still true).
  await svc.from("restaurants").update({ is_open: true, open_until: past }).eq("id", rid);
  const rej = await place();
  console.log("expired-window order:", rej.error ? `BLOCKED ("${rej.error.message}") ✓` : "NOT BLOCKED ✗");

  // 3) place_order works when checked in with a future window.
  await svc.from("restaurants").update({ is_open: true, open_until: future }).eq("id", rid);
  const ok = await place();
  console.log("checked-in order:", ok.error ? `ERR ${ok.error.message}` : "PLACED ✓");
  if (ok.data) { await svc.from("payments").delete().eq("order_id", ok.data); await svc.from("orders").delete().eq("id", ok.data); }

  // Restore original state.
  await svc.from("restaurants").update({ is_open: r0.is_open, open_until: r0.open_until, checked_in_at: r0.checked_in_at }).eq("id", rid);
  console.log("DONE restored");
}
main().catch((e) => console.log("SCRIPT_ERR " + e.message));

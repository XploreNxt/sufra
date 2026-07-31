import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const svc = createClient(URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = () => createClient(URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  // Referrer = existing test customer.
  const { data: referrer } = await svc.from("users").select("id, referral_code").eq("email", "customer@test.com").single();
  console.log("referrer code:", referrer.referral_code);

  // Fresh friend account.
  const femail = `reftest_${Date.now()}@test.com`;
  const { data: created, error: cerr } = await svc.auth.admin.createUser({ email: femail, password: "Test1234!", email_confirm: true });
  if (cerr) return console.log("CREATE_FRIEND_ERR " + cerr.message);
  const friendId = created.user.id;

  const friend = anon();
  await friend.auth.signInWithPassword({ email: femail, password: "Test1234!" });

  // Friend applies referrer's code.
  const { data: welcome, error: aerr } = await friend.rpc("apply_referral_code", { p_code: referrer.referral_code });
  console.log("apply_referral_code:", aerr ? "ERR " + aerr.message : "welcome=" + welcome);
  const { data: fu } = await svc.from("users").select("referred_by").eq("id", friendId).single();
  console.log("friend.referred_by == referrer:", fu.referred_by === referrer.id);

  // Personal enforcement: referrer cannot preview the friend's welcome code.
  const ref = anon();
  await ref.auth.signInWithPassword({ email: "customer@test.com", password: "Test1234!" });
  const { data: rest } = await svc.from("restaurants").select("id, is_open").eq("name", "Karachi Biryani House").single();
  const wasOpen = rest.is_open;
  if (!wasOpen) await svc.from("restaurants").update({ is_open: true }).eq("id", rest.id);
  const pv = await ref.rpc("preview_voucher", { p_code: welcome, p_subtotal: 600, p_restaurant: rest.id });
  console.log("referrer previews friend's code (expect blocked):", pv.error ? "BLOCKED (" + pv.error.message + ")" : "NOT BLOCKED " + JSON.stringify(pv.data));

  // Friend places an order, then it's delivered → referrer rewarded.
  const { data: addr } = await svc.from("addresses").insert({ user_id: friendId, label: "Home", address_text: "Test", city: "Karachi" }).select("id").single();
  const { data: item } = await svc.from("menu_items").select("id").eq("restaurant_id", rest.id).eq("name", "Chicken Biryani").single();
  const { data: oid, error: oe } = await friend.rpc("place_order", { p_restaurant_id: rest.id, p_address_id: addr.id, p_items: [{ menu_item_id: item.id, quantity: 1 }], p_voucher_code: null, p_bundles: [] });
  if (oe) console.log("PLACE_ORDER_ERR " + oe.message);
  await svc.from("orders").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", oid);
  const { data: reward } = await svc.from("vouchers").select("code, value, user_id").eq("user_id", referrer.id).ilike("code", "REF%");
  console.log("referrer reward voucher:", JSON.stringify(reward));
  const { data: fru } = await svc.from("users").select("referral_rewarded").eq("id", friendId).single();
  console.log("friend.referral_rewarded:", fru.referral_rewarded);

  // Cleanup: order → reward voucher → friend account.
  await svc.from("orders").delete().eq("id", oid);
  await svc.from("vouchers").delete().eq("user_id", referrer.id).ilike("code", "REF%");
  await svc.auth.admin.deleteUser(friendId);
  if (!wasOpen) await svc.from("restaurants").update({ is_open: false }).eq("id", rest.id);
  console.log("DONE cleaned up");
}
main().catch((e) => console.log("SCRIPT_ERR " + e.message));

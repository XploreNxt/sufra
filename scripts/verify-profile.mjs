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
const cust = createClient(URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const auth = await cust.auth.signInWithPassword({
    email: "customer@test.com",
    password: "Test1234!",
  });
  if (auth.error) return console.log("SIGNIN_ERR " + auth.error.message);
  const uid = auth.data.user.id;

  // --- Profile update (RLS: users update own) ---
  const { data: before } = await cust.from("users").select("full_name, phone").eq("id", uid).single();
  const up = await cust.from("users").update({ full_name: "Test Customer", phone: "03001234567" }).eq("id", uid).select("full_name, phone");
  console.log("PROFILE update:", up.error ? "ERR " + up.error.message : JSON.stringify(up.data));
  await cust.from("users").update({ full_name: before.full_name, phone: before.phone }).eq("id", uid);

  // --- Favorites (new table, RLS owner crud) ---
  const rid = "4e4aab54-6c39-41b4-a133-9d32d3361eab"; // Cheezy Bites
  await cust.from("favorites").delete().eq("user_id", uid).eq("restaurant_id", rid);
  const favIns = await cust.from("favorites").insert({ user_id: uid, restaurant_id: rid }).select("id");
  console.log("FAV insert:", favIns.error ? "ERR " + favIns.error.message : "ok");
  const favList = await cust.from("favorites").select("restaurants(name)").order("created_at", { ascending: false });
  console.log("FAV list:", favList.error ? "ERR " + favList.error.message : JSON.stringify(favList.data));
  await cust.from("favorites").delete().eq("user_id", uid).eq("restaurant_id", rid);
  const favAfter = await cust.from("favorites").select("id").eq("user_id", uid).eq("restaurant_id", rid);
  console.log("FAV after delete count:", (favAfter.data ?? []).length);

  // --- Address CRUD + setDefault (RLS owner crud) ---
  const ins = await cust.from("addresses").insert({ user_id: uid, label: "Work", address_text: "Test office", city: "Karachi", lat: 24.86, lng: 67.01 }).select("id").single();
  console.log("ADDR create:", ins.error ? "ERR " + ins.error.message : "ok " + ins.data.id);
  const aid = ins.data.id;
  // setDefault: clear others, set this
  await cust.from("addresses").update({ is_default: false }).eq("user_id", uid).eq("is_default", true);
  await cust.from("addresses").update({ is_default: true }).eq("id", aid);
  const def = await cust.from("addresses").select("is_default").eq("id", aid).single();
  console.log("ADDR setDefault:", def.data?.is_default === true);
  const updn = await cust.from("addresses").update({ address_text: "Test office (edited)" }).eq("id", aid).select("address_text");
  console.log("ADDR update:", updn.error ? "ERR " + updn.error.message : JSON.stringify(updn.data));
  await cust.from("addresses").update({ is_default: false }).eq("id", aid); // unset so we don't leave a bogus default
  const del = await cust.from("addresses").delete().eq("id", aid);
  console.log("ADDR delete:", del.error ? "ERR " + del.error.message : "ok");

  console.log("DONE");
}
main().catch((e) => console.log("SCRIPT_ERR " + e.message));

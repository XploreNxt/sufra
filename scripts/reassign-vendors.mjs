// Gives each restaurant its own dedicated vendor login (one vendor = one
// restaurant, no switcher). Idempotent. Run: node scripts/reassign-vendors.mjs
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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Test1234!";

// restaurant name -> dedicated vendor login
const OWNERS = [
  { restaurant: "Karachi Biryani House", email: "karachi@test.com", name: "Karachi Biryani House" },
  { restaurant: "Lahori Chargha & Grill", email: "lahori@test.com", name: "Lahori Chargha & Grill" },
  { restaurant: "Cheezy Bites", email: "cheezy@test.com", name: "Cheezy Bites" },
];

const { data: list, error: listErr } = await admin.auth.admin.listUsers();
if (listErr) throw listErr;
const byEmail = Object.fromEntries(list.users.map((u) => [u.email, u.id]));

for (const o of OWNERS) {
  // 1. Ensure the vendor auth account exists.
  let userId = byEmail[o.email];
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: o.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: o.name },
    });
    if (error) {
      console.error(`x ${o.email}: ${error.message}`);
      continue;
    }
    userId = data.user.id;
    console.log(`+ created ${o.email}`);
  } else {
    console.log(`= ${o.email} exists`);
  }

  // 2. Make it a vendor.
  await admin
    .from("users")
    .update({ role: "vendor", full_name: o.name, email: o.email })
    .eq("id", userId);

  // 3. Point the restaurant at this owner.
  const { data: rows, error: rErr } = await admin
    .from("restaurants")
    .update({ owner_user_id: userId })
    .eq("name", o.restaurant)
    .select("name");
  if (rErr) console.error(`x reassign ${o.restaurant}: ${rErr.message}`);
  else console.log(`  ${o.restaurant} -> ${o.email}`);
}

console.log(`\nDone. Each restaurant now has its own vendor login (password: ${PASSWORD}).`);

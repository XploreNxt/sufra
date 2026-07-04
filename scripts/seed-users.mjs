// Creates dev test accounts (one per role) via the Supabase admin API.
// Run with: node scripts/seed-users.mjs
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

const ACCOUNTS = [
  { email: "customer@test.com", role: "customer", full_name: "Test Customer" },
  { email: "vendor@test.com", role: "vendor", full_name: "Test Vendor" },
  { email: "rider@test.com", role: "rider", full_name: "Test Rider" },
  { email: "admin@test.com", role: "admin", full_name: "Test Admin" },
];
const PASSWORD = "Test1234!";

for (const acc of ACCOUNTS) {
  const { data, error } = await admin.auth.admin.createUser({
    email: acc.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: acc.full_name },
  });

  let userId = data?.user?.id;
  if (error) {
    if (String(error.message).toLowerCase().includes("already")) {
      const { data: list } = await admin.auth.admin.listUsers();
      userId = list.users.find((u) => u.email === acc.email)?.id;
      console.log(`= ${acc.email} already exists`);
    } else {
      console.error(`x ${acc.email}: ${error.message}`);
      continue;
    }
  } else {
    console.log(`+ created ${acc.email}`);
  }

  if (!userId) continue;
  // Profile row is created by the on_auth_user_created trigger; set its role.
  const { error: upErr } = await admin
    .from("users")
    .update({ role: acc.role, full_name: acc.full_name, email: acc.email })
    .eq("id", userId);
  if (upErr) console.error(`x role for ${acc.email}: ${upErr.message}`);
  else console.log(`  role -> ${acc.role}`);
}

console.log(`\nAll accounts use password: ${PASSWORD}`);

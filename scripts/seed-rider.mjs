// Creates an active rider profile for rider@test.com (idempotent).
// In production riders apply and an admin approves them (Phase 6).
// Run with: node scripts/seed-rider.mjs
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

const { data: list, error: listErr } = await admin.auth.admin.listUsers();
if (listErr) throw listErr;
const rider = list.users.find((u) => u.email === "rider@test.com");
if (!rider) throw new Error("rider@test.com not found — run seed-users.mjs first");

const { data: existing } = await admin
  .from("riders").select("id, status").eq("user_id", rider.id).maybeSingle();

if (existing) {
  console.log(`= rider profile exists (status: ${existing.status})`);
} else {
  const { error } = await admin.from("riders").insert({
    user_id: rider.id,
    vehicle_type: "bike",
    cnic: "42101-1234567-1",
    license_no: "TEST-LIC-001",
    status: "active",
    is_online: false,
  });
  if (error) throw error;
  console.log("+ created active rider profile for rider@test.com");
}

"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { error?: string; ok?: boolean };

async function isAdmin(): Promise<boolean> {
  const profile = await getSessionProfile();
  return profile?.role === "admin";
}

function validEmail(e: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
}

/** Pakistani phone → E.164 (for the contact field only; not auth). */
function normalizePkPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("92")) return `+${digits}`;
  if (digits.startsWith("0")) return `+92${digits.slice(1)}`;
  return `+92${digits}`;
}

function friendlyAuthError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("already") || m.includes("registered") || m.includes("exists"))
    return "An account with this email already exists.";
  if (m.includes("password"))
    return "Password must be at least 6 characters.";
  return message ?? "Could not create the account.";
}

// ---------------- Vendor ----------------

export interface NewVendorInput {
  full_name: string;
  email: string;
  password: string;
  restaurant_name: string;
  description: string;
  cuisine_types: string; // comma separated
  commission_rate: number;
  delivery_fee: number;
  min_order: number;
}

export async function createVendor(input: NewVendorInput): Promise<Result> {
  if (!(await isAdmin())) return { error: "Admin access required" };

  const email = input.email.trim().toLowerCase();
  const fullName = input.full_name.trim();
  if (!fullName) return { error: "Owner name is required" };
  if (!validEmail(email)) return { error: "Enter a valid email address" };
  if (input.password.length < 6)
    return { error: "Password must be at least 6 characters" };
  if (!input.restaurant_name.trim())
    return { error: "Restaurant name is required" };
  if (input.commission_rate < 0 || input.commission_rate > 50)
    return { error: "Commission must be between 0 and 50%" };
  if (input.delivery_fee < 0 || input.min_order < 0)
    return { error: "Fees cannot be negative" };

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true, // no email verification step needed
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    return { error: friendlyAuthError(error?.message) };
  }
  const userId = data.user.id;

  // The signup trigger created a public.users row (role customer) — promote it.
  const { error: uErr } = await admin
    .from("users")
    .update({ role: "vendor", full_name: fullName, email })
    .eq("id", userId);
  if (uErr) return { error: uErr.message };

  const cuisines = input.cuisine_types
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const { error: rErr } = await admin.from("restaurants").insert({
    owner_user_id: userId,
    name: input.restaurant_name.trim(),
    description: input.description.trim() || null,
    cuisine_types: cuisines,
    commission_rate: input.commission_rate,
    delivery_fee: input.delivery_fee,
    min_order: input.min_order,
    status: "active",
    is_open: false,
  });
  if (rErr) return { error: `Account made, but the restaurant failed: ${rErr.message}` };

  revalidatePath("/admin/vendors");
  return { ok: true };
}

// ---------------- Rider ----------------

export interface NewRiderInput {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  vehicle_type: string;
  cnic: string;
  license_no: string;
}

export async function createRider(input: NewRiderInput): Promise<Result> {
  if (!(await isAdmin())) return { error: "Admin access required" };

  const email = input.email.trim().toLowerCase();
  const fullName = input.full_name.trim();
  if (!fullName) return { error: "Rider name is required" };
  if (!validEmail(email)) return { error: "Enter a valid email address" };
  if (input.password.length < 6)
    return { error: "Password must be at least 6 characters" };

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    return { error: friendlyAuthError(error?.message) };
  }
  const userId = data.user.id;

  const { error: uErr } = await admin
    .from("users")
    .update({ role: "rider", full_name: fullName, email })
    .eq("id", userId);
  if (uErr) return { error: uErr.message };

  // Contact phone is best-effort (unique column) — never block onboarding on it.
  const phone = input.phone.trim() ? normalizePkPhone(input.phone) : null;
  if (phone) {
    await admin.from("users").update({ phone }).eq("id", userId);
  }

  const { error: rErr } = await admin.from("riders").insert({
    user_id: userId,
    vehicle_type: input.vehicle_type.trim() || null,
    cnic: input.cnic.trim() || null,
    license_no: input.license_no.trim() || null,
    status: "active",
    is_online: false,
  });
  if (rErr) return { error: `Account made, but the rider profile failed: ${rErr.message}` };

  revalidatePath("/admin/riders");
  return { ok: true };
}

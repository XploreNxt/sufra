"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";

type ActionResult = { error?: string };

async function requireAdmin(): Promise<string | null> {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") return "Admin access required";
  return null;
}

export interface VoucherInput {
  code: string;
  discount_type: "percent" | "fixed";
  value: number;
  min_order: number;
  max_discount: number | null;
  valid_to: string | null; // ISO date
  usage_limit: number | null;
}

export async function createVoucher(input: VoucherInput): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9]{3,20}$/.test(code))
    return { error: "Code must be 3–20 letters/numbers" };
  if (!(input.value > 0)) return { error: "Value must be positive" };
  if (input.discount_type === "percent" && input.value > 100)
    return { error: "Percent discount cannot exceed 100" };

  const supabase = await createClient();
  const { error } = await supabase.from("vouchers").insert({
    code,
    discount_type: input.discount_type,
    value: input.value,
    min_order: input.min_order || 0,
    max_discount: input.max_discount,
    valid_from: new Date().toISOString(),
    valid_to: input.valid_to,
    usage_limit: input.usage_limit,
    is_active: true,
  });
  if (error) {
    if (error.code === "23505") return { error: "That code already exists" };
    return { error: error.message };
  }
  revalidatePath("/admin/vouchers");
  return {};
}

export async function setVoucherActive(
  voucherId: string,
  isActive: boolean
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const supabase = await createClient();
  const { error } = await supabase
    .from("vouchers")
    .update({ is_active: isActive })
    .eq("id", voucherId);
  if (error) return { error: error.message };
  revalidatePath("/admin/vouchers");
  return {};
}

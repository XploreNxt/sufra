"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type Result = { error?: string };

async function ownsRestaurant(
  supabase: SupabaseClient,
  restaurantId: string
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  return !!data;
}

export interface VendorVoucherInput {
  code: string;
  discount_type: "percent" | "fixed";
  value: number;
  min_order: number;
  max_discount: number | null;
  valid_to: string | null;
  usage_limit: number | null;
}

export async function createVendorVoucher(
  restaurantId: string,
  input: VendorVoucherInput
): Promise<Result> {
  const supabase = await createClient();
  if (!(await ownsRestaurant(supabase, restaurantId)))
    return { error: "Not your restaurant" };

  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9]{3,20}$/.test(code))
    return { error: "Code must be 3–20 letters or numbers" };
  if (!(input.value > 0)) return { error: "Discount value must be positive" };
  if (input.discount_type === "percent" && input.value > 100)
    return { error: "Percent discount can't exceed 100" };

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
    restaurant_id: restaurantId,
  });
  if (error) {
    if (error.code === "23505")
      return { error: "That code is already taken — choose another." };
    return { error: error.message };
  }
  revalidatePath("/vendor/promos");
  return {};
}

export async function setVendorVoucherActive(
  voucherId: string,
  isActive: boolean
): Promise<Result> {
  const supabase = await createClient();
  // RLS restricts this to the vendor's own vouchers.
  const { error } = await supabase
    .from("vouchers")
    .update({ is_active: isActive })
    .eq("id", voucherId);
  if (error) return { error: error.message };
  revalidatePath("/vendor/promos");
  return {};
}

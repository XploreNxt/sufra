"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** New customer redeems a friend's referral code → welcome voucher. */
export async function applyReferral(
  code: string
): Promise<{ welcomeCode?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("apply_referral_code", {
    p_code: code.trim(),
  });
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { welcomeCode: data as string };
}

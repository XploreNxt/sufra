"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string };

/** Edit the customer's own name + phone (role/email are not touched here). */
export async function updateProfile(input: {
  full_name: string;
  phone: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in" };

  const full_name = input.full_name.trim();
  const phone = input.phone.trim();
  if (!full_name) return { error: "Name is required" };
  if (phone && !/^[+0-9][0-9\s-]{6,15}$/.test(phone)) {
    return { error: "Enter a valid phone number" };
  }

  const { error } = await supabase
    .from("users")
    .update({ full_name, phone: phone || null })
    .eq("id", user.id);
  if (error) {
    if (error.code === "23505")
      return { error: "That phone number is already in use." };
    return { error: error.message };
  }
  revalidatePath("/profile");
  return {};
}

/** Customer preferences: default spice, favourite cuisines, notifications. */
export async function updatePreferences(input: {
  default_spice: string | null;
  favorite_cuisines: string[];
  notify_order_updates: boolean;
  notify_promotions: boolean;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in" };

  const spice =
    input.default_spice && ["mild", "medium", "hot"].includes(input.default_spice)
      ? input.default_spice
      : null;

  const { error } = await supabase
    .from("users")
    .update({
      default_spice: spice,
      favorite_cuisines: input.favorite_cuisines,
      notify_order_updates: input.notify_order_updates,
      notify_promotions: input.notify_promotions,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return {};
}

/**
 * Step 1 of a password change: email the account a 6-digit verification
 * code (Supabase reauthentication). No password is changed yet.
 */
export async function requestPasswordChangeOtp(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in" };
  const { error } = await supabase.auth.reauthenticate();
  if (error) return { error: error.message };
  return {};
}

/**
 * Step 2: verify the emailed code (nonce) and set the new password in one
 * call — updateUser rejects the change if the code is wrong or expired.
 */
export async function changePasswordWithOtp(
  newPassword: string,
  code: string
): Promise<ActionResult> {
  if (newPassword.length < 8)
    return { error: "Password must be at least 8 characters" };
  if (!/^\d{6}$/.test(code.trim()))
    return { error: "Enter the 6-digit code from your email" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
    nonce: code.trim(),
  });
  if (error) return { error: error.message };
  return {};
}

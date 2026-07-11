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

/** Change the account password. */
export async function changePassword(
  newPassword: string
): Promise<ActionResult> {
  if (newPassword.length < 8)
    return { error: "Password must be at least 8 characters" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return {};
}

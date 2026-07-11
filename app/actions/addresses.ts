"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { NewAddressInput } from "@/app/actions/orders";

type ActionResult = { error?: string };

async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function updateAddress(
  id: string,
  input: NewAddressInput
): Promise<ActionResult> {
  const { supabase, user } = await authed();
  if (!user) return { error: "Please sign in" };
  if (!input.address_text.trim()) return { error: "Address is required" };

  // RLS scopes the update to the caller's own addresses.
  const { error } = await supabase
    .from("addresses")
    .update({
      label: input.label.trim() || "Home",
      address_text: input.address_text.trim(),
      landmark: input.landmark.trim() || null,
      city: input.city.trim() || "Karachi",
      lat: input.lat ?? null,
      lng: input.lng ?? null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/profile/addresses");
  return {};
}

export async function deleteAddress(id: string): Promise<ActionResult> {
  const { supabase, user } = await authed();
  if (!user) return { error: "Please sign in" };
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/profile/addresses");
  return {};
}

export async function setDefaultAddress(id: string): Promise<ActionResult> {
  const { supabase, user } = await authed();
  if (!user) return { error: "Please sign in" };
  // Clear the current default, then set the new one (both RLS-scoped to owner).
  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", user.id)
    .eq("is_default", true);
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/profile/addresses");
  return {};
}

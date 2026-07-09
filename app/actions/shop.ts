"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RestaurantHours } from "@/types";

type ActionResult = { error?: string };

async function ownedRestaurant(restaurantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ownerId: null };
  const { data } = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  return { supabase, ownerId: data ? user.id : null };
}

/** Shop timings — saved instantly (operational, no approval). */
export async function updateRestaurantHours(
  restaurantId: string,
  hours: RestaurantHours
): Promise<ActionResult> {
  const { supabase, ownerId } = await ownedRestaurant(restaurantId);
  if (!ownerId) return { error: "Not your restaurant" };

  const { error } = await supabase
    .from("restaurants")
    .update({ hours })
    .eq("id", restaurantId);
  if (error) return { error: error.message };
  revalidatePath("/vendor/settings");
  return {};
}

/**
 * Logo / cover change — staged for admin approval. The live images keep
 * showing to customers until the change is approved.
 */
export async function submitRestaurantBranding(
  restaurantId: string,
  input: { logo_url?: string | null; cover_url?: string | null }
): Promise<ActionResult> {
  const { supabase, ownerId } = await ownedRestaurant(restaurantId);
  if (!ownerId) return { error: "Not your restaurant" };

  if (!input.logo_url && !input.cover_url) {
    return { error: "Upload a new logo or cover first" };
  }

  const patch: Record<string, unknown> = { branding_rejection_reason: null };
  if (input.logo_url) patch.pending_logo_url = input.logo_url;
  if (input.cover_url) patch.pending_cover_url = input.cover_url;

  const { error } = await supabase
    .from("restaurants")
    .update(patch)
    .eq("id", restaurantId);
  if (error) return { error: error.message };
  revalidatePath("/vendor/settings");
  return {};
}

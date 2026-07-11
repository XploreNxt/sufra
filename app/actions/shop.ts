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

/**
 * Map pin — staged for admin approval. The live pin (lat/lng) keeps
 * working for customers until the change is approved.
 */
export async function submitRestaurantPin(
  restaurantId: string,
  pin: { lat: number; lng: number }
): Promise<ActionResult> {
  const { supabase, ownerId } = await ownedRestaurant(restaurantId);
  if (!ownerId) return { error: "Not your restaurant" };
  if (
    !Number.isFinite(pin.lat) ||
    !Number.isFinite(pin.lng) ||
    pin.lat < -90 ||
    pin.lat > 90 ||
    pin.lng < -180 ||
    pin.lng > 180
  ) {
    return { error: "Please drop a valid pin on the map first" };
  }

  const { error } = await supabase
    .from("restaurants")
    .update({
      pending_lat: pin.lat,
      pending_lng: pin.lng,
      location_rejection_reason: null,
    })
    .eq("id", restaurantId);
  if (error) return { error: error.message };
  revalidatePath("/vendor/settings");
  return {};
}

/** Cuisines + spice levels the shop serves — saved instantly. */
export async function updateShopProfile(
  restaurantId: string,
  input: { cuisine_types: string[]; spice_levels: string[] }
): Promise<ActionResult> {
  const { supabase, ownerId } = await ownedRestaurant(restaurantId);
  if (!ownerId) return { error: "Not your restaurant" };

  const spice = input.spice_levels.filter((s) =>
    ["mild", "medium", "hot"].includes(s)
  );
  const cuisines = input.cuisine_types.map((c) => c.trim()).filter(Boolean);

  const { error } = await supabase
    .from("restaurants")
    .update({ cuisine_types: cuisines, spice_levels: spice })
    .eq("id", restaurantId);
  if (error) return { error: error.message };
  revalidatePath("/vendor/settings");
  return {};
}

/** Delivery radius (km) — saved instantly, no approval. */
export async function updateDeliveryRadius(
  restaurantId: string,
  km: number
): Promise<ActionResult> {
  const { supabase, ownerId } = await ownedRestaurant(restaurantId);
  if (!ownerId) return { error: "Not your restaurant" };
  if (!Number.isFinite(km) || km < 1 || km > 50) {
    return { error: "Radius must be between 1 and 50 km" };
  }

  const { error } = await supabase
    .from("restaurants")
    .update({ delivery_radius_km: km })
    .eq("id", restaurantId);
  if (error) return { error: error.message };
  revalidatePath("/vendor/settings");
  return {};
}

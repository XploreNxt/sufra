import { createClient } from "@/lib/supabase/server";
import type { Bundle, Restaurant, RestaurantWithMenu } from "@/types";
import { haversineKm, type CustomerLocation } from "@/lib/geo";

/** Active offers/bundles for a restaurant's customer page. */
export async function getRestaurantBundles(
  restaurantId: string
): Promise<Bundle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bundles")
    .select(
      "id, restaurant_id, name, description, image_url, price, is_active, sort_order, bundle_items(id, quantity, menu_items(name))"
    )
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as Bundle[];
}

export interface RestaurantReview {
  id: string;
  restaurant_rating: number | null;
  comment: string | null;
  created_at: string;
}

export async function getRestaurantReviews(
  restaurantId: string
): Promise<RestaurantReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, restaurant_rating, comment, created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return (data ?? []) as RestaurantReview[];
}

/**
 * Active restaurants for the home feed. Only restaurants with an approved
 * pin (lat/lng) are discoverable, and — once we know the customer's
 * location — only those whose delivery radius covers the customer. Each
 * card gets a `distance_km` so the UI can show "X km away".
 */
export async function getActiveRestaurants(
  loc?: CustomerLocation | null
): Promise<Restaurant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("status", "active")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("is_open", { ascending: false })
    .order("rating_avg", { ascending: false, nullsFirst: false });

  if (error) throw error;
  const list = (data ?? []) as Restaurant[];
  if (!loc) return list;

  return list
    .map((r) => ({
      ...r,
      distance_km: haversineKm(loc.lat, loc.lng, r.lat as number, r.lng as number),
    }))
    .filter((r) => (r.distance_km as number) <= Number(r.delivery_radius_km))
    .sort((a, b) => {
      if (a.is_open !== b.is_open) return a.is_open ? -1 : 1;
      return (a.distance_km as number) - (b.distance_km as number);
    });
}

/** One restaurant with its full menu tree (categories → items → modifiers). */
export async function getRestaurantWithMenu(
  id: string
): Promise<RestaurantWithMenu | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      "*, menu_categories(*, menu_items(*, modifier_groups(*, modifiers(*))))"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const restaurant = data as RestaurantWithMenu;
  restaurant.menu_categories.sort((a, b) => a.sort_order - b.sort_order);
  for (const cat of restaurant.menu_categories) {
    cat.menu_items.sort((a, b) => a.sort_order - b.sort_order);
  }
  return restaurant;
}

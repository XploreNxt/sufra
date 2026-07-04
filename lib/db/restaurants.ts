import { createClient } from "@/lib/supabase/server";
import type { Restaurant, RestaurantWithMenu } from "@/types";

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

/** Active restaurants for the home feed (RLS also hides non-active ones). */
export async function getActiveRestaurants(): Promise<Restaurant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("status", "active")
    .order("is_open", { ascending: false })
    .order("rating_avg", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as Restaurant[];
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

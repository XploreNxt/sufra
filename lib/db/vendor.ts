import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, Restaurant, RestaurantWithMenu } from "@/types";

const ACTIVE_RESTAURANT_COOKIE = "active_restaurant";

/**
 * Restaurants owned by the signed-in vendor. Must filter by owner
 * explicitly — the restaurants read policy allows reading ANY active
 * restaurant (for customer discovery), so RLS alone does not scope this.
 */
export async function getVendorRestaurants(): Promise<Restaurant[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Restaurant[];
}

/** The vendor's currently selected restaurant (cookie, falls back to first). */
export async function getActiveRestaurant(): Promise<{
  restaurant: Restaurant | null;
  all: Restaurant[];
}> {
  const all = await getVendorRestaurants();
  if (all.length === 0) return { restaurant: null, all };

  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACTIVE_RESTAURANT_COOKIE)?.value;
  const restaurant = all.find((r) => r.id === preferred) ?? all[0];
  return { restaurant, all };
}

export interface VendorOrder {
  id: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  placed_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  order_items: Array<{
    id: string;
    name_snapshot: string;
    quantity: number;
    special_instructions: string | null;
    order_item_modifiers: Array<{ id: string; name_snapshot: string }>;
  }>;
}

export async function getVendorOrders(
  restaurantId: string
): Promise<VendorOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, status, subtotal, delivery_fee, total, payment_method,
       placed_at, accepted_at, ready_at,
       order_items(id, name_snapshot, quantity, special_instructions,
         order_item_modifiers(id, name_snapshot))`
    )
    .eq("restaurant_id", restaurantId)
    .order("placed_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data ?? []) as unknown as VendorOrder[];
}

export async function getVendorMenu(
  restaurantId: string
): Promise<RestaurantWithMenu | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      "*, menu_categories(*, menu_items(*, modifier_groups(*, modifiers(*))))"
    )
    .eq("id", restaurantId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const r = data as RestaurantWithMenu;
  r.menu_categories.sort((a, b) => a.sort_order - b.sort_order);
  for (const c of r.menu_categories)
    c.menu_items.sort((a, b) => a.sort_order - b.sort_order);
  return r;
}

export interface EarningsRow {
  id: string;
  subtotal: number;
  total: number;
  delivered_at: string | null;
}

export async function getDeliveredOrders(
  restaurantId: string
): Promise<EarningsRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, subtotal, total, delivered_at")
    .eq("restaurant_id", restaurantId)
    .eq("status", "delivered")
    .order("delivered_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EarningsRow[];
}

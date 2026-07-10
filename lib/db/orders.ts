import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types";
import type { DateRange } from "@/lib/datetime";

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  total: number;
  placed_at: string;
  restaurants: { name: string } | null;
}

export interface OrderDetail extends OrderSummary {
  subtotal: number;
  delivery_fee: number;
  discount: number;
  payment_method: string;
  rider_id: string | null;
  reviews: {
    id: string;
    restaurant_rating: number | null;
    rider_rating: number | null;
    comment: string | null;
  } | null;
  order_items: Array<{
    id: string;
    name_snapshot: string;
    price_snapshot: number;
    quantity: number;
    special_instructions: string | null;
    order_item_modifiers: Array<{
      id: string;
      name_snapshot: string;
      price_snapshot: number;
    }>;
  }>;
  addresses: {
    label: string | null;
    address_text: string | null;
    landmark: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
  riders: {
    id: string;
    current_lat: number | null;
    current_lng: number | null;
  } | null;
}

/** Orders of the signed-in customer (RLS scopes rows). */
export async function getMyOrders(range?: DateRange): Promise<OrderSummary[]> {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, status, total, placed_at, restaurants(name)");
  if (range?.from) query = query.gte("placed_at", range.from.toISOString());
  if (range?.to) query = query.lte("placed_at", range.to.toISOString());
  const { data, error } = await query.order("placed_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as OrderSummary[];
}

export async function getOrder(id: string): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, status, total, subtotal, delivery_fee, discount, payment_method,
       placed_at, rider_id,
       restaurants(name),
       addresses(label, address_text, landmark, lat, lng),
       riders(id, current_lat, current_lng),
       reviews(id, restaurant_rating, rider_rating, comment),
       order_items(id, name_snapshot, price_snapshot, quantity, special_instructions,
         order_item_modifiers(id, name_snapshot, price_snapshot))`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as OrderDetail) ?? null;
}


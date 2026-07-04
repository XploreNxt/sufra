import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types";

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
  payment_method: string;
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
  } | null;
}

/** Orders of the signed-in customer (RLS scopes rows). */
export async function getMyOrders(): Promise<OrderSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, total, placed_at, restaurants(name)")
    .order("placed_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as OrderSummary[];
}

export async function getOrder(id: string): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, status, total, subtotal, delivery_fee, payment_method, placed_at,
       restaurants(name),
       addresses(label, address_text, landmark),
       order_items(id, name_snapshot, price_snapshot, quantity, special_instructions,
         order_item_modifiers(id, name_snapshot, price_snapshot))`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as OrderDetail) ?? null;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Waiting for restaurant",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for pickup",
  assigned: "Rider assigned",
  picked_up: "Picked up",
  on_the_way: "On the way",
  delivered: "Delivered",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-sky-100 text-sky-800",
  preparing: "bg-sky-100 text-sky-800",
  ready: "bg-indigo-100 text-indigo-800",
  assigned: "bg-indigo-100 text-indigo-800",
  picked_up: "bg-violet-100 text-violet-800",
  on_the_way: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-neutral-200 text-neutral-600",
};

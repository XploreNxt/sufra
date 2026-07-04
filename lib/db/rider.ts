import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types";

export interface RiderProfile {
  id: string;
  user_id: string;
  vehicle_type: string | null;
  status: "pending" | "active" | "suspended";
  is_online: boolean;
}

export async function getRiderProfile(): Promise<RiderProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("riders")
    .select("id, user_id, vehicle_type, status, is_online")
    .maybeSingle();
  if (error) throw error;
  return (data as RiderProfile) ?? null;
}

export interface AvailableOrder {
  order_id: string;
  restaurant_name: string;
  restaurant_address: string | null;
  total: number;
  cod_amount: number | null;
  delivery_fee: number;
  placed_at: string;
}

export async function getAvailableOrders(): Promise<AvailableOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rider_available_orders");
  if (error) {
    if (error.message.includes("not active")) return [];
    throw error;
  }
  return (data ?? []) as AvailableOrder[];
}

export interface ActiveDelivery {
  order_id: string;
  status: OrderStatus;
  restaurant_name: string;
  restaurant_address: string | null;
  restaurant_lat: number | null;
  restaurant_lng: number | null;
  total: number;
  cod_amount: number | null;
  delivery_fee: number;
  address_label: string | null;
  address_text: string | null;
  landmark: string | null;
  drop_lat: number | null;
  drop_lng: number | null;
  customer_name: string | null;
  customer_phone: string | null;
}

export async function getActiveDelivery(): Promise<ActiveDelivery | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rider_active_order");
  if (error) throw error;
  const rows = (data ?? []) as ActiveDelivery[];
  return rows[0] ?? null;
}

export interface LedgerRow {
  id: string;
  order_id: string;
  amount_collected: number;
  amount_owed_to_platform: number;
  is_settled: boolean;
  settled_at: string | null;
}

export async function getCodLedger(): Promise<LedgerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cod_ledger")
    .select("id, order_id, amount_collected, amount_owed_to_platform, is_settled, settled_at")
    .order("is_settled")
    .limit(100);
  if (error) throw error;
  return (data ?? []) as LedgerRow[];
}

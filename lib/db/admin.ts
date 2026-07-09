import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types";

export interface AdminOrder {
  id: string;
  status: OrderStatus;
  total: number;
  payment_method: string;
  payment_status: string;
  placed_at: string;
  restaurants: { name: string } | null;
  riders: { id: string; users: { full_name: string | null } | null } | null;
}

export async function getAllOrders(): Promise<AdminOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, status, total, payment_method, payment_status, placed_at,
       restaurants(name),
       riders(id, users(full_name))`
    )
    .order("placed_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as AdminOrder[];
}

export interface AdminRestaurant {
  id: string;
  name: string;
  status: "pending" | "active" | "suspended";
  is_open: boolean;
  commission_rate: number;
  delivery_fee: number;
  min_order: number;
  created_at: string;
  users: { full_name: string | null; email: string | null } | null;
}

export async function getRestaurantsAdmin(): Promise<AdminRestaurant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      `id, name, status, is_open, commission_rate, delivery_fee, min_order,
       created_at, users!restaurants_owner_user_id_fkey(full_name, email)`
    )
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as AdminRestaurant[];
}

export interface AdminRider {
  id: string;
  status: "pending" | "active" | "suspended";
  is_online: boolean;
  vehicle_type: string | null;
  cnic: string | null;
  users: { full_name: string | null; phone: string | null; email: string | null } | null;
}

export async function getRidersAdmin(): Promise<AdminRider[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("riders")
    .select(
      "id, status, is_online, vehicle_type, cnic, users(full_name, phone, email)"
    )
    .order("status");
  if (error) throw error;
  return (data ?? []) as unknown as AdminRider[];
}

/** Active riders for the manual-reassign dropdown. */
export async function getAssignableRiders(): Promise<
  Array<{ id: string; name: string; is_online: boolean }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("riders")
    .select("id, is_online, users(full_name)")
    .eq("status", "active");
  if (error) throw error;
  type Row = { id: string; is_online: boolean; users: { full_name: string | null } | null };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    name: r.users?.full_name ?? "Rider",
    is_online: r.is_online,
  }));
}

export interface AdminLedgerRow {
  id: string;
  order_id: string;
  amount_collected: number;
  amount_owed_to_platform: number;
  is_settled: boolean;
  settled_at: string | null;
  riders: { id: string; users: { full_name: string | null } | null } | null;
}

export async function getCodLedgerAdmin(): Promise<AdminLedgerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cod_ledger")
    .select(
      `id, order_id, amount_collected, amount_owed_to_platform, is_settled,
       settled_at, riders(id, users(full_name))`
    )
    .order("is_settled")
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as AdminLedgerRow[];
}

export interface PendingMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  status: string;
  restaurants: { name: string } | null;
  menu_categories: { name: string } | null;
}

export async function getPendingMenuItems(): Promise<PendingMenuItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select(
      "id, name, description, price, image_url, status, restaurants(name), menu_categories(name)"
    )
    .eq("status", "pending")
    .order("restaurant_id");
  if (error) throw error;
  return (data ?? []) as unknown as PendingMenuItem[];
}

export interface PendingBranding {
  id: string;
  name: string;
  logo_url: string | null;
  cover_url: string | null;
  pending_logo_url: string | null;
  pending_cover_url: string | null;
}

export async function getPendingBranding(): Promise<PendingBranding[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, logo_url, cover_url, pending_logo_url, pending_cover_url")
    .or("pending_logo_url.not.is.null,pending_cover_url.not.is.null")
    .order("name");
  if (error) throw error;
  return (data ?? []) as PendingBranding[];
}

export interface AdminStats {
  ordersToday: number;
  gmvDelivered: number;
  commissionEarned: number;
  deliveredCount: number;
  activeRestaurants: number;
  pendingRestaurants: number;
  ridersOnline: number;
  pendingRiders: number;
  unsettledCod: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();

  const [ordersRes, restaurantsRes, ridersRes, ledgerRes] = await Promise.all([
    supabase
      .from("orders")
      .select("status, total, subtotal, placed_at, restaurants(commission_rate)")
      .limit(1000),
    supabase.from("restaurants").select("status"),
    supabase.from("riders").select("status, is_online"),
    supabase
      .from("cod_ledger")
      .select("amount_owed_to_platform, is_settled")
      .eq("is_settled", false),
  ]);

  type OrderRow = {
    status: string;
    total: number;
    subtotal: number;
    placed_at: string;
    restaurants: { commission_rate: number } | null;
  };
  const orders = (ordersRes.data ?? []) as unknown as OrderRow[];
  const restaurants = restaurantsRes.data ?? [];
  const riders = ridersRes.data ?? [];
  const ledger = ledgerRes.data ?? [];

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const delivered = orders.filter((o) => o.status === "delivered");

  return {
    ordersToday: orders.filter(
      (o) => new Date(o.placed_at) >= startOfDay
    ).length,
    gmvDelivered: delivered.reduce((s, o) => s + Number(o.total), 0),
    commissionEarned: delivered.reduce(
      (s, o) =>
        s +
        (Number(o.subtotal) * Number(o.restaurants?.commission_rate ?? 0)) / 100,
      0
    ),
    deliveredCount: delivered.length,
    activeRestaurants: restaurants.filter((r) => r.status === "active").length,
    pendingRestaurants: restaurants.filter((r) => r.status === "pending").length,
    ridersOnline: riders.filter((r) => r.is_online).length,
    pendingRiders: riders.filter((r) => r.status === "pending").length,
    unsettledCod: ledger.reduce(
      (s, l) => s + Number(l.amount_owed_to_platform),
      0
    ),
  };
}

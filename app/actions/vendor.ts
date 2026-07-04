"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types";

type ActionResult = { error?: string };

/** Legal vendor-side transitions. Rider/admin transitions live elsewhere. */
const VENDOR_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ["accepted", "rejected"],
  accepted: ["preparing"],
  preparing: ["ready"],
};

export async function updateOrderStatus(
  orderId: string,
  next: OrderStatus
): Promise<ActionResult> {
  const supabase = await createClient();

  // RLS already scopes this to the vendor's own restaurant orders.
  const { data: order, error: readErr } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();
  if (readErr) return { error: readErr.message };
  if (!order) return { error: "Order not found" };

  const allowed = VENDOR_TRANSITIONS[order.status as OrderStatus] ?? [];
  if (!allowed.includes(next)) {
    return { error: `Cannot move order from ${order.status} to ${next}` };
  }

  const patch: Record<string, unknown> = { status: next };
  if (next === "accepted") patch.accepted_at = new Date().toISOString();
  if (next === "ready") patch.ready_at = new Date().toISOString();

  const { error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", orderId)
    .eq("status", order.status); // guard against concurrent updates

  if (error) return { error: error.message };
  revalidatePath("/vendor");
  return {};
}

export async function setRestaurantOpen(
  restaurantId: string,
  isOpen: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({ is_open: isOpen })
    .eq("id", restaurantId);
  if (error) return { error: error.message };
  revalidatePath("/vendor", "layout");
  return {};
}

export async function setActiveRestaurant(restaurantId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("active_restaurant", restaurantId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/vendor", "layout");
}

// ---------- Menu CRUD ----------

export async function createCategory(
  restaurantId: string,
  name: string
): Promise<ActionResult> {
  if (!name.trim()) return { error: "Name is required" };
  const supabase = await createClient();
  const { error } = await supabase.from("menu_categories").insert({
    restaurant_id: restaurantId,
    name: name.trim(),
    sort_order: 99,
  });
  if (error) return { error: error.message };
  revalidatePath("/vendor/menu");
  return {};
}

export interface MenuItemInput {
  name: string;
  description: string;
  price: number;
}

export async function createMenuItem(
  restaurantId: string,
  categoryId: string,
  input: MenuItemInput
): Promise<ActionResult> {
  if (!input.name.trim()) return { error: "Name is required" };
  if (!(input.price > 0)) return { error: "Price must be positive" };
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").insert({
    restaurant_id: restaurantId,
    category_id: categoryId,
    name: input.name.trim(),
    description: input.description.trim() || null,
    price: input.price,
    is_available: true,
    sort_order: 99,
  });
  if (error) return { error: error.message };
  revalidatePath("/vendor/menu");
  return {};
}

export async function updateMenuItem(
  itemId: string,
  input: MenuItemInput
): Promise<ActionResult> {
  if (!input.name.trim()) return { error: "Name is required" };
  if (!(input.price > 0)) return { error: "Price must be positive" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({
      name: input.name.trim(),
      description: input.description.trim() || null,
      price: input.price,
    })
    .eq("id", itemId);
  if (error) return { error: error.message };
  revalidatePath("/vendor/menu");
  return {};
}

export async function setItemAvailability(
  itemId: string,
  isAvailable: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: isAvailable })
    .eq("id", itemId);
  if (error) return { error: error.message };
  revalidatePath("/vendor/menu");
  return {};
}

export async function deleteMenuItem(itemId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", itemId);
  if (error) return { error: error.message };
  revalidatePath("/vendor/menu");
  return {};
}

"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pushToCustomer } from "@/lib/push/send";
import type { OrderStatus } from "@/types";

type ActionResult = { error?: string };

// Customer-facing push copy for vendor-side transitions.
const PUSH_MSG: Partial<Record<OrderStatus, { title: string; body: string }>> = {
  preparing: { title: "👨‍🍳 In the kitchen", body: "Your order is being prepared." },
  ready: { title: "✅ Order ready", body: "Your order is ready — a rider will pick it up soon." },
  cancelled: { title: "Order cancelled", body: "Sorry — your order was cancelled." },
};

/**
 * Legal vendor-side transitions. A new order arrives 'pending'; the vendor
 * Accepts it to confirm (or Rejects). A cancel escape hatch stays available
 * once cooking has started.
 */
const VENDOR_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ["accepted", "rejected"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
};

export async function updateOrderStatus(
  orderId: string,
  next: OrderStatus
): Promise<ActionResult> {
  const supabase = await createClient();

  // RLS already scopes this to the vendor's own restaurant orders.
  const { data: order, error: readErr } = await supabase
    .from("orders")
    .select("id, status, customer_id")
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

  const msg = PUSH_MSG[next];
  if (msg) {
    try {
      await pushToCustomer(order.customer_id, { ...msg, url: `/orders/${orderId}` });
    } catch {
      /* push is best-effort */
    }
  }
  revalidatePath("/vendor");
  return {};
}

/**
 * Vendor check-in: opens the shop for business now. open_until (today's
 * close time, computed client-side in the vendor's timezone) drives the
 * automatic close — null means no auto-close (manual only).
 */
export async function checkInRestaurant(
  restaurantId: string,
  openUntil: string | null
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({
      is_open: true,
      checked_in_at: new Date().toISOString(),
      open_until: openUntil,
    })
    .eq("id", restaurantId);
  if (error) return { error: error.message };
  revalidatePath("/vendor", "layout");
  return {};
}

/** Manual open/close. Closing also clears the auto-close timer. */
export async function setRestaurantOpen(
  restaurantId: string,
  isOpen: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update(isOpen ? { is_open: true } : { is_open: false, open_until: null })
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
  image_url?: string | null;
}

// New items start as 'pending' (the column default) so customers don't see
// them until an admin approves.
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
    image_url: input.image_url ?? null,
    is_available: true,
    sort_order: 99,
    status: "pending",
  });
  if (error) return { error: error.message };
  revalidatePath("/vendor/menu");
  return {};
}

// Any content edit sends the item back for review (hidden from customers
// until re-approved) and clears a previous rejection reason.
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
      image_url: input.image_url ?? null,
      status: "pending",
      rejection_reason: null,
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

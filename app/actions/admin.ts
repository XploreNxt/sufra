"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";

type ActionResult = { error?: string };

async function requireAdmin(): Promise<string | null> {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") return "Admin access required";
  return null;
}

export async function approveRestaurantBranding(
  restaurantId: string
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("restaurants")
    .select("pending_logo_url, pending_cover_url")
    .eq("id", restaurantId)
    .maybeSingle();
  if (!r) return { error: "Restaurant not found" };

  // Only apply the images that were actually changed.
  const patch: Record<string, unknown> = {
    pending_logo_url: null,
    pending_cover_url: null,
    branding_rejection_reason: null,
  };
  if (r.pending_logo_url) patch.logo_url = r.pending_logo_url;
  if (r.pending_cover_url) patch.cover_url = r.pending_cover_url;

  const { error } = await supabase
    .from("restaurants")
    .update(patch)
    .eq("id", restaurantId);
  if (error) return { error: error.message };
  revalidatePath("/admin/menu");
  return {};
}

export async function rejectRestaurantBranding(
  restaurantId: string,
  reason: string
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };
  if (!reason.trim()) return { error: "Please give a reason for the rejection" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({
      pending_logo_url: null,
      pending_cover_url: null,
      branding_rejection_reason: reason.trim(),
    })
    .eq("id", restaurantId);
  if (error) return { error: error.message };
  revalidatePath("/admin/menu");
  return {};
}

export async function approveMenuItem(itemId: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ status: "approved", rejection_reason: null })
    .eq("id", itemId);
  if (error) return { error: error.message };
  revalidatePath("/admin/menu");
  return {};
}

export async function rejectMenuItem(
  itemId: string,
  reason: string
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };
  if (!reason.trim()) return { error: "Please give a reason for the rejection" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ status: "rejected", rejection_reason: reason.trim() })
    .eq("id", itemId);
  if (error) return { error: error.message };
  revalidatePath("/admin/menu");
  return {};
}

export async function setRestaurantStatus(
  restaurantId: string,
  status: "pending" | "active" | "suspended"
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({ status })
    .eq("id", restaurantId);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return {};
}

export interface RestaurantDetailsInput {
  name: string;
  description: string;
  cuisine_types: string; // comma separated
  phone: string;
  address_text: string;
  lat: number | null;
  lng: number | null;
  commission_rate: number;
  delivery_fee: number;
  min_order: number;
  default_prep_minutes: number;
}

/** Admin-only: edit every restaurant detail (name, address, phone, fees…). */
export async function updateRestaurantDetails(
  restaurantId: string,
  input: RestaurantDetailsInput
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };
  if (!input.name.trim()) return { error: "Name is required" };
  if (input.commission_rate < 0 || input.commission_rate > 50)
    return { error: "Commission must be between 0 and 50%" };
  if (input.delivery_fee < 0 || input.min_order < 0)
    return { error: "Fees cannot be negative" };
  if (input.default_prep_minutes < 0)
    return { error: "Prep time cannot be negative" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({
      name: input.name.trim(),
      description: input.description.trim() || null,
      cuisine_types: input.cuisine_types
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      phone: input.phone.trim() || null,
      address_text: input.address_text.trim() || null,
      lat: input.lat,
      lng: input.lng,
      commission_rate: input.commission_rate,
      delivery_fee: input.delivery_fee,
      min_order: input.min_order,
      default_prep_minutes: input.default_prep_minutes,
    })
    .eq("id", restaurantId);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return {};
}

export async function setRiderStatus(
  riderId: string,
  status: "pending" | "active" | "suspended"
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status !== "active") patch.is_online = false;
  const { error } = await supabase
    .from("riders")
    .update(patch)
    .eq("id", riderId);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return {};
}

export async function adminAssignRider(
  orderId: string,
  riderId: string
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { error: "Order not found" };
  if (!["ready", "assigned"].includes(order.status))
    return { error: `Cannot assign a rider while order is ${order.status}` };

  const { error } = await supabase
    .from("orders")
    .update({ rider_id: riderId, status: "assigned" })
    .eq("id", orderId);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return {};
}

export async function adminCancelOrder(orderId: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("status, payment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { error: "Order not found" };
  if (["delivered", "cancelled", "rejected"].includes(order.status))
    return { error: `Order is already ${order.status}` };

  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);
  if (error) return { error: error.message };

  if (order.payment_status === "paid") {
    await supabase
      .from("payments")
      .update({ status: "refunded" })
      .eq("order_id", orderId);
    await supabase
      .from("orders")
      .update({ payment_status: "refunded" })
      .eq("id", orderId);
  }

  revalidatePath("/admin", "layout");
  return {};
}

export async function settleLedgerRow(ledgerId: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const supabase = await createClient();
  const { error } = await supabase
    .from("cod_ledger")
    .update({ is_settled: true, settled_at: new Date().toISOString() })
    .eq("id", ledgerId)
    .eq("is_settled", false);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return {};
}

export async function settleAllForRider(riderId: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const supabase = await createClient();
  const { error } = await supabase
    .from("cod_ledger")
    .update({ is_settled: true, settled_at: new Date().toISOString() })
    .eq("rider_id", riderId)
    .eq("is_settled", false);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return {};
}

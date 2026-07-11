"use server";

import { createClient } from "@/lib/supabase/server";

export interface PlaceOrderInput {
  restaurant_id: string;
  address_id: string;
  voucher_code?: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
    modifier_ids: string[];
    special_instructions?: string;
    spice_level?: string;
  }>;
  bundles?: Array<{ bundle_id: string; quantity: number }>;
}

export async function placeOrder(
  input: PlaceOrderInput
): Promise<{ orderId?: string; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("place_order", {
    p_restaurant_id: input.restaurant_id,
    p_address_id: input.address_id,
    p_items: input.items,
    p_voucher_code: input.voucher_code?.trim() || null,
    p_bundles: input.bundles ?? [],
  });

  if (error) return { error: error.message };
  return { orderId: data as string };
}

export async function previewVoucher(
  code: string,
  subtotal: number,
  restaurantId: string
): Promise<{ discount?: number; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("preview_voucher", {
    p_code: code.trim(),
    p_subtotal: subtotal,
    p_restaurant: restaurantId,
  });
  if (error) return { error: error.message };
  return { discount: Number(data) };
}

export async function submitReview(input: {
  order_id: string;
  restaurant_rating: number;
  rider_rating?: number | null;
  comment?: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_review", {
    p_order_id: input.order_id,
    p_restaurant_rating: input.restaurant_rating,
    p_rider_rating: input.rider_rating ?? null,
    p_comment: input.comment ?? null,
  });
  if (error) return { error: error.message };
  return {};
}

export interface ReorderLine {
  kind: "item";
  menu_item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  modifiers: [];
}

/**
 * Rebuild a cart from a past order using the *current* menu (live prices,
 * only still-available items). Item customisations aren't reconstructed
 * (modifier ids aren't snapshotted), so the customer re-picks those.
 */
export async function getReorderCart(orderId: string): Promise<{
  restaurant?: { id: string; name: string; delivery_fee: number; min_order: number };
  lines?: ReorderLine[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in" };

  const { data: order } = await supabase
    .from("orders")
    .select(
      `restaurants(id, name, delivery_fee, min_order, status),
       order_items(menu_item_id, quantity)`
    )
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle();
  if (!order) return { error: "Order not found" };

  const r = order.restaurants as unknown as {
    id: string;
    name: string;
    delivery_fee: number;
    min_order: number;
    status: string;
  } | null;
  if (!r || r.status !== "active")
    return { error: "This restaurant isn't available right now" };

  const items = (order.order_items as Array<{ menu_item_id: string | null; quantity: number }>)
    .filter((i) => i.menu_item_id);
  if (items.length === 0) return { error: "Nothing here can be reordered" };

  const { data: current } = await supabase
    .from("menu_items")
    .select("id, name, price, is_available")
    .in(
      "id",
      items.map((i) => i.menu_item_id as string)
    );
  const byId = new Map(
    (current ?? []).map((m) => [m.id as string, m])
  );

  const lines: ReorderLine[] = [];
  for (const i of items) {
    const cur = byId.get(i.menu_item_id as string);
    if (!cur || !cur.is_available) continue;
    lines.push({
      kind: "item",
      menu_item_id: cur.id as string,
      name: cur.name as string,
      unit_price: Number(cur.price),
      quantity: i.quantity,
      modifiers: [],
    });
  }
  if (lines.length === 0)
    return { error: "Those items aren't available anymore" };

  return {
    restaurant: {
      id: r.id,
      name: r.name,
      delivery_fee: Number(r.delivery_fee),
      min_order: Number(r.min_order),
    },
    lines,
  };
}

export interface NewAddressInput {
  label: string;
  address_text: string;
  landmark: string;
  city: string;
  lat?: number | null;
  lng?: number | null;
}

export async function createAddress(
  input: NewAddressInput
): Promise<{ addressId?: string; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first" };

  if (!input.address_text.trim()) return { error: "Address is required" };

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      label: input.label.trim() || "Home",
      address_text: input.address_text.trim(),
      landmark: input.landmark.trim() || null,
      city: input.city.trim() || "Karachi",
      lat: input.lat ?? null,
      lng: input.lng ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { addressId: data.id };
}

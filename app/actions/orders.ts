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

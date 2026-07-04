"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types";

type ActionResult = { error?: string };

export async function setRiderOnline(isOnline: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("riders")
    .update({ is_online: isOnline })
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/rider", "layout");
  return {};
}

export async function acceptDelivery(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("rider_accept_order", {
    p_order_id: orderId,
  });
  if (error) return { error: error.message };
  revalidatePath("/rider");
  return {};
}

export async function updateDeliveryStatus(
  orderId: string,
  next: OrderStatus
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("rider_update_status", {
    p_order_id: orderId,
    p_next: next,
  });
  if (error) return { error: error.message };
  revalidatePath("/rider");
  return {};
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type Result = { error?: string };

async function ownsRestaurant(
  supabase: SupabaseClient,
  restaurantId: string
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  return !!data;
}

export interface NewBundleInput {
  name: string;
  description: string;
  image_url: string | null;
  price: number;
  items: Array<{ menu_item_id: string; quantity: number }>;
}

export async function createBundle(
  restaurantId: string,
  input: NewBundleInput
): Promise<Result> {
  const supabase = await createClient();
  if (!(await ownsRestaurant(supabase, restaurantId)))
    return { error: "Not your restaurant" };

  if (!input.name.trim()) return { error: "Bundle name is required" };
  if (!(input.price > 0)) return { error: "Price must be positive" };
  const items = input.items.filter((i) => i.menu_item_id && i.quantity > 0);
  if (items.length === 0)
    return { error: "Add at least one item to the bundle" };

  const { data: bundle, error } = await supabase
    .from("bundles")
    .insert({
      restaurant_id: restaurantId,
      name: input.name.trim(),
      description: input.description.trim() || null,
      image_url: input.image_url,
      price: input.price,
      is_active: true,
      sort_order: 0,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { error: biErr } = await supabase.from("bundle_items").insert(
    items.map((i) => ({
      bundle_id: bundle.id,
      menu_item_id: i.menu_item_id,
      quantity: i.quantity,
    }))
  );
  if (biErr) return { error: biErr.message };

  revalidatePath("/vendor/menu");
  return {};
}

export async function setBundleActive(
  bundleId: string,
  isActive: boolean
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bundles")
    .update({ is_active: isActive })
    .eq("id", bundleId);
  if (error) return { error: error.message };
  revalidatePath("/vendor/menu");
  return {};
}

export async function deleteBundle(bundleId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("bundles").delete().eq("id", bundleId);
  if (error) return { error: error.message };
  revalidatePath("/vendor/menu");
  return {};
}

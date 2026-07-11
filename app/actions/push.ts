"use server";

import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

/** Save (or refresh) this browser's push subscription for the customer. */
export async function saveSubscription(
  sub: { endpoint?: string } & Record<string, unknown>
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in" };
  if (!sub?.endpoint) return { error: "Invalid subscription" };

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, endpoint: sub.endpoint, subscription: sub },
      { onConflict: "endpoint" }
    );
  if (error) return { error: error.message };
  return {};
}

export async function removeSubscription(endpoint: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) return { error: error.message };
  return {};
}

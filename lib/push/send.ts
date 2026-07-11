import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;
function configure(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@sufra.com";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Send a web push to all of a customer's devices, respecting their
 * order-update preference. Best-effort: failures are swallowed and dead
 * subscriptions (404/410) are cleaned up. Safe no-op if VAPID isn't set.
 */
export async function pushToCustomer(
  customerId: string,
  payload: PushPayload
): Promise<void> {
  if (!configure()) return;
  const admin = createAdminClient();

  const { data: user } = await admin
    .from("users")
    .select("notify_order_updates")
    .eq("id", customerId)
    .single();
  if (!user?.notify_order_updates) return;

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, subscription")
    .eq("user_id", customerId);
  if (!subs?.length) return;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          s.subscription as webpush.PushSubscription,
          JSON.stringify(payload)
        );
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    })
  );
}

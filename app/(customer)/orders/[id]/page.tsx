import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { getOrder } from "@/lib/db/orders";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/order-status";
import { formatPrice } from "@/types";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { TrackOrderMap } from "@/components/customer/track-order";
import { ReviewForm } from "@/components/customer/review-form";

const TRACKABLE = ["assigned", "picked_up", "on_the_way"];

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?next=/orders");

  const { id } = await params;
  const order = await getOrder(id).catch(() => null);
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-2xl">
      <RealtimeRefresh
        channel={`order-${order.id}`}
        tables={[{ table: "orders", filter: `id=eq.${order.id}` }]}
        fallbackSeconds={45}
      />
      <Link
        href="/orders"
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← All orders
      </Link>

      <div className="mt-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">
              Order at {order.restaurants?.name ?? "Restaurant"}
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              Placed{" "}
              {new Date(order.placed_at).toLocaleString("en-PK", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[order.status]}`}
          >
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        {order.status === "pending" && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your order has been sent to the restaurant. This page updates
            live — no need to refresh.
          </p>
        )}

        {TRACKABLE.includes(order.status) && order.riders && (
          <div className="mt-4">
            <h2 className="font-semibold text-neutral-900">
              Track your rider
            </h2>
            <TrackOrderMap
              riderId={order.riders.id}
              initialLat={order.riders.current_lat}
              initialLng={order.riders.current_lng}
              dropLat={order.addresses?.lat ?? null}
              dropLng={order.addresses?.lng ?? null}
            />
          </div>
        )}

        <h2 className="mt-6 font-semibold text-neutral-900">Items</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>
                <span className="font-medium text-neutral-800">
                  {item.quantity}× {item.name_snapshot}
                </span>
                {item.order_item_modifiers.length > 0 && (
                  <span className="block text-neutral-500">
                    {item.order_item_modifiers
                      .map((m) => m.name_snapshot)
                      .join(", ")}
                  </span>
                )}
                {item.special_instructions && (
                  <span className="block italic text-neutral-400">
                    “{item.special_instructions}”
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap text-neutral-700">
                {formatPrice(
                  (Number(item.price_snapshot) +
                    item.order_item_modifiers.reduce(
                      (s, m) => s + Number(m.price_snapshot),
                      0
                    )) *
                    item.quantity
                )}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1.5 border-t border-neutral-200 pt-3 text-sm">
          <div className="flex justify-between text-neutral-600">
            <dt>Subtotal</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Voucher discount</dt>
              <dd>−{formatPrice(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-neutral-600">
            <dt>Delivery fee</dt>
            <dd>{formatPrice(order.delivery_fee)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold text-neutral-900">
            <dt>Total ({order.payment_method.toUpperCase()})</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>

        {order.addresses && (
          <>
            <h2 className="mt-6 font-semibold text-neutral-900">
              Delivering to
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              <span className="font-medium">{order.addresses.label}</span> —{" "}
              {order.addresses.address_text}
              {order.addresses.landmark && (
                <span className="block text-neutral-400">
                  Near {order.addresses.landmark}
                </span>
              )}
            </p>
          </>
        )}

        {order.status === "delivered" &&
          (order.reviews ? (
            <div className="mt-6 rounded-xl bg-neutral-50 p-4">
              <h2 className="font-semibold text-neutral-900">Your review</h2>
              <p className="mt-1 text-sm text-amber-500">
                {"★".repeat(order.reviews.restaurant_rating ?? 0)}
                <span className="text-neutral-300">
                  {"★".repeat(5 - (order.reviews.restaurant_rating ?? 0))}
                </span>
                {order.reviews.rider_rating != null && (
                  <span className="ml-3 text-neutral-500">
                    Rider: {order.reviews.rider_rating}/5
                  </span>
                )}
              </p>
              {order.reviews.comment && (
                <p className="mt-1 text-sm text-neutral-600">
                  “{order.reviews.comment}”
                </p>
              )}
            </div>
          ) : (
            <ReviewForm orderId={order.id} hasRider={order.rider_id != null} />
          ))}
      </div>
    </main>
  );
}

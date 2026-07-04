"use client";

import { useState, useTransition } from "react";
import { updateDeliveryStatus } from "@/app/actions/rider";
import type { ActiveDelivery } from "@/lib/db/rider";
import type { OrderStatus } from "@/types";
import { formatPrice } from "@/types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/order-status";

const NEXT_STEP: Partial<
  Record<OrderStatus, { to: OrderStatus; label: string }>
> = {
  assigned: { to: "picked_up", label: "I picked up the order" },
  picked_up: { to: "on_the_way", label: "Start delivery" },
  on_the_way: { to: "delivered", label: "Delivered — cash collected" },
};

function mapsLink(
  lat: number | null,
  lng: number | null,
  fallback: string | null
): string {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fallback ?? "")}`;
}

export function ActiveDeliveryCard({ delivery }: { delivery: ActiveDelivery }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const step = NEXT_STEP[delivery.status];

  const pickupPhase = delivery.status === "assigned";
  const dest = pickupPhase
    ? {
        title: "Pick up from",
        name: delivery.restaurant_name,
        text: delivery.restaurant_address,
        landmark: null as string | null,
        link: mapsLink(
          delivery.restaurant_lat,
          delivery.restaurant_lng,
          delivery.restaurant_address
        ),
      }
    : {
        title: "Deliver to",
        name: delivery.customer_name ?? "Customer",
        text: delivery.address_text,
        landmark: delivery.landmark,
        link: mapsLink(delivery.drop_lat, delivery.drop_lng, delivery.address_text),
      };

  function advance() {
    if (!step) return;
    if (
      step.to === "delivered" &&
      !window.confirm(
        `Confirm you collected ${formatPrice(delivery.cod_amount ?? delivery.total)} in cash?`
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const r = await updateDeliveryStatus(delivery.order_id, step.to);
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-xs text-neutral-400">
            #{delivery.order_id.slice(0, 8)}
          </span>
          <h2 className="text-lg font-bold text-neutral-900">
            {delivery.restaurant_name}
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[delivery.status]}`}
        >
          {STATUS_LABELS[delivery.status]}
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3">
        <p className="text-sm font-medium text-amber-800">
          Collect on delivery (COD)
        </p>
        <p className="text-2xl font-black text-amber-900">
          {formatPrice(delivery.cod_amount ?? delivery.total)}
        </p>
        <p className="text-xs text-amber-700">
          Your delivery fee: {formatPrice(delivery.delivery_fee)}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-neutral-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {dest.title}
        </p>
        <p className="mt-1 font-semibold text-neutral-900">{dest.name}</p>
        {dest.text && <p className="text-sm text-neutral-600">{dest.text}</p>}
        {dest.landmark && (
          <p className="text-sm text-neutral-400">Near {dest.landmark}</p>
        )}
        {!pickupPhase && delivery.customer_phone && (
          <a
            href={`tel:${delivery.customer_phone}`}
            className="mt-1 inline-block text-sm font-medium text-emerald-700 hover:underline"
          >
            📞 {delivery.customer_phone}
          </a>
        )}
        <a
          href={dest.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block rounded-lg border border-emerald-600 px-4 py-2 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          🧭 Navigate with Google Maps
        </a>
      </div>

      {step && (
        <button
          onClick={advance}
          disabled={pending}
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Updating…" : step.label}
        </button>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}

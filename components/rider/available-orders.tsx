"use client";

import { useState, useTransition } from "react";
import { acceptDelivery } from "@/app/actions/rider";
import type { AvailableOrder } from "@/lib/db/rider";
import { formatPrice } from "@/types";

export function AvailableOrdersList({ orders }: { orders: AvailableOrder[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function accept(orderId: string) {
    setError(null);
    startTransition(async () => {
      const r = await acceptDelivery(orderId);
      if (r.error) setError(r.error);
    });
  }

  if (orders.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-neutral-400">
        No deliveries waiting right now — new ones appear automatically.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {orders.map((o) => (
        <div
          key={o.order_id}
          className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-neutral-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-neutral-900">
                {o.restaurant_name}
              </h3>
              {o.restaurant_address && (
                <p className="text-sm text-neutral-500">{o.restaurant_address}</p>
              )}
            </div>
            <span className="font-mono text-xs text-neutral-400">
              #{o.order_id.slice(0, 8)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-neutral-600">
              <p>
                Collect{" "}
                <span className="font-bold text-neutral-900">
                  {formatPrice(o.cod_amount ?? o.total)}
                </span>{" "}
                (COD)
              </p>
              <p className="text-xs text-neutral-400">
                Your fee: {formatPrice(o.delivery_fee)}
              </p>
            </div>
            <button
              onClick={() => accept(o.order_id)}
              disabled={pending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {pending ? "…" : "Accept delivery"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

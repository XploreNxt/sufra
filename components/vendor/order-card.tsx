"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/app/actions/vendor";
import type { VendorOrder } from "@/lib/db/vendor";
import type { OrderStatus } from "@/types";
import { formatPrice } from "@/types";
import { formatDateTime } from "@/lib/datetime";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/order-status";

const NEXT_ACTIONS: Partial<
  Record<OrderStatus, Array<{ to: OrderStatus; label: string; danger?: boolean }>>
> = {
  accepted: [
    { to: "preparing", label: "Start preparing" },
    { to: "cancelled", label: "Cancel", danger: true },
  ],
  preparing: [{ to: "ready", label: "Mark ready" }],
};

export function VendorOrderCard({ order }: { order: VendorOrder }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const actions = NEXT_ACTIONS[order.status] ?? [];

  function act(to: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, to);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="font-mono text-xs text-neutral-400">
            #{order.id.slice(0, 8)}
          </span>
          <p className="text-sm text-neutral-500">
            {formatDateTime(order.placed_at)} ·{" "}
            {order.payment_method.toUpperCase()}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status]}`}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <ul className="mt-3 space-y-1 text-sm text-neutral-700">
        {order.order_items.map((item) => (
          <li key={item.id}>
            <span className="font-medium">
              {item.quantity}× {item.name_snapshot}
            </span>
            {item.order_item_modifiers.length > 0 && (
              <span className="text-neutral-500">
                {" "}
                — {item.order_item_modifiers.map((m) => m.name_snapshot).join(", ")}
              </span>
            )}
            {item.special_instructions && (
              <span className="block text-xs italic text-amber-700">
                “{item.special_instructions}”
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
        <span className="font-bold text-neutral-900">
          {formatPrice(order.total)}
        </span>
        <div className="flex gap-2">
          {actions.map((a) => (
            <button
              key={a.to}
              onClick={() => act(a.to)}
              disabled={pending}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 ${
                a.danger
                  ? "border border-red-300 text-red-700 hover:bg-red-50"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {pending ? "…" : a.label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { adminAssignRider, adminCancelOrder } from "@/app/actions/admin";
import type { AdminOrder } from "@/lib/db/admin";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/order-status";
import { formatPrice } from "@/types";

const OPEN_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "assigned",
  "picked_up",
  "on_the_way",
];

export function OrdersMonitor({
  orders,
  riders,
}: {
  orders: AdminOrder[];
  riders: Array<{ id: string; name: string; is_online: boolean }>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [assigning, setAssigning] = useState<string | null>(null);

  function assign(orderId: string, riderId: string) {
    if (!riderId) return;
    setError(null);
    startTransition(async () => {
      const r = await adminAssignRider(orderId, riderId);
      if (r.error) setError(r.error);
      setAssigning(null);
    });
  }

  function cancel(orderId: string) {
    if (!window.confirm("Cancel this order? Paid amounts will be marked refunded."))
      return;
    setError(null);
    startTransition(async () => {
      const r = await adminCancelOrder(orderId);
      if (r.error) setError(r.error);
    });
  }

  const open = orders.filter((o) => OPEN_STATUSES.includes(o.status));
  const closed = orders.filter((o) => !OPEN_STATUSES.includes(o.status));

  const Table = ({ rows, live }: { rows: AdminOrder[]; live: boolean }) => (
    <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-neutral-200">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-neutral-50 text-left text-neutral-500">
          <tr>
            <th className="px-4 py-2.5 font-medium">Order</th>
            <th className="px-4 py-2.5 font-medium">Restaurant</th>
            <th className="px-4 py-2.5 font-medium">Rider</th>
            <th className="px-4 py-2.5 font-medium">Placed</th>
            <th className="px-4 py-2.5 text-right font-medium">Total</th>
            <th className="px-4 py-2.5 text-right font-medium">Status</th>
            {live && <th className="px-4 py-2.5 text-right font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} className="border-t border-neutral-100">
              <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">
                #{o.id.slice(0, 8)}
              </td>
              <td className="px-4 py-2.5">{o.restaurants?.name}</td>
              <td className="px-4 py-2.5 text-neutral-600">
                {o.riders?.users?.full_name ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-neutral-500">
                {new Date(o.placed_at).toLocaleTimeString("en-PK", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-4 py-2.5 text-right">{formatPrice(o.total)}</td>
              <td className="px-4 py-2.5 text-right">
                <span
                  className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status]}`}
                >
                  {STATUS_LABELS[o.status]}
                </span>
              </td>
              {live && (
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-2">
                    {["ready", "assigned"].includes(o.status) &&
                      (assigning === o.id ? (
                        <select
                          autoFocus
                          defaultValue=""
                          disabled={pending}
                          onChange={(e) => assign(o.id, e.target.value)}
                          onBlur={() => setAssigning(null)}
                          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                        >
                          <option value="" disabled>
                            Pick rider…
                          </option>
                          {riders.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} {r.is_online ? "(online)" : "(offline)"}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setAssigning(o.id)}
                          className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                        >
                          {o.riders ? "Reassign" : "Assign rider"}
                        </button>
                      ))}
                    <button
                      onClick={() => cancel(o.id)}
                      disabled={pending}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={live ? 7 : 6}
                className="px-4 py-6 text-center text-neutral-400"
              >
                Nothing here.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <h2 className="text-lg font-bold text-neutral-900">
        Live orders
        {open.length > 0 && (
          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            {open.length}
          </span>
        )}
      </h2>
      <Table rows={open} live />

      <h2 className="mt-8 text-lg font-bold text-neutral-900">Completed</h2>
      <Table rows={closed} live={false} />
    </div>
  );
}

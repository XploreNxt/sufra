"use client";

import { useState, useTransition } from "react";
import {
  setRestaurantStatus,
  updateRestaurantFees,
} from "@/app/actions/admin";
import type { AdminRestaurant } from "@/lib/db/admin";
import { formatPrice } from "@/types";

const STATUS_STYLES: Record<AdminRestaurant["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  suspended: "bg-red-100 text-red-800",
};

export function VendorsTable({ restaurants }: { restaurants: AdminRestaurant[] }) {
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [commission, setCommission] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [pending, startTransition] = useTransition();

  function changeStatus(id: string, status: AdminRestaurant["status"]) {
    setError(null);
    startTransition(async () => {
      const r = await setRestaurantStatus(id, status);
      if (r.error) setError(r.error);
    });
  }

  function startEdit(r: AdminRestaurant) {
    setEditing(r.id);
    setCommission(String(r.commission_rate));
    setDeliveryFee(String(r.delivery_fee));
  }

  function saveFees(id: string) {
    setError(null);
    startTransition(async () => {
      const r = await updateRestaurantFees(
        id,
        Number(commission),
        Number(deliveryFee)
      );
      if (r.error) setError(r.error);
      else setEditing(null);
    });
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-neutral-200">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Restaurant</th>
              <th className="px-4 py-2.5 font-medium">Owner</th>
              <th className="px-4 py-2.5 text-right font-medium">Commission</th>
              <th className="px-4 py-2.5 text-right font-medium">Delivery fee</th>
              <th className="px-4 py-2.5 text-right font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100 align-middle">
                <td className="px-4 py-2.5">
                  <span className="font-semibold text-neutral-900">{r.name}</span>
                  <span className="ml-2 text-xs text-neutral-400">
                    {r.is_open ? "· open" : "· closed"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-neutral-600">
                  {r.users?.full_name ?? r.users?.email ?? "—"}
                </td>
                {editing === r.id ? (
                  <>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        value={commission}
                        onChange={(e) => setCommission(e.target.value)}
                        type="number"
                        min="0"
                        max="50"
                        className="w-16 rounded-lg border border-neutral-300 px-2 py-1 text-right text-sm"
                      />
                      %
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      Rs{" "}
                      <input
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.value)}
                        type="number"
                        min="0"
                        className="w-20 rounded-lg border border-neutral-300 px-2 py-1 text-right text-sm"
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 text-right">
                      {Number(r.commission_rate)}%
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {formatPrice(r.delivery_fee)}
                    </td>
                  </>
                )}
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-2">
                    {editing === r.id ? (
                      <>
                        <button
                          onClick={() => saveFees(r.id)}
                          disabled={pending}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="rounded-lg px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-800"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(r)}
                          className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                        >
                          Edit fees
                        </button>
                        {r.status !== "active" && (
                          <button
                            onClick={() => changeStatus(r.id, "active")}
                            disabled={pending}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {r.status === "pending" ? "Approve" : "Reactivate"}
                          </button>
                        )}
                        {r.status === "active" && (
                          <button
                            onClick={() => changeStatus(r.id, "suspended")}
                            disabled={pending}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Suspend
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { setRiderStatus } from "@/app/actions/admin";
import type { AdminRider } from "@/lib/db/admin";

const STATUS_STYLES: Record<AdminRider["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  suspended: "bg-red-100 text-red-800",
};

export function RidersTable({ riders }: { riders: AdminRider[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function changeStatus(id: string, status: AdminRider["status"]) {
    setError(null);
    startTransition(async () => {
      const r = await setRiderStatus(id, status);
      if (r.error) setError(r.error);
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
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Rider</th>
              <th className="px-4 py-2.5 font-medium">Contact</th>
              <th className="px-4 py-2.5 font-medium">Vehicle</th>
              <th className="px-4 py-2.5 font-medium">CNIC</th>
              <th className="px-4 py-2.5 text-right font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {riders.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="px-4 py-2.5">
                  <span className="font-semibold text-neutral-900">
                    {r.users?.full_name ?? "—"}
                  </span>
                  {r.is_online && (
                    <span className="ml-2 text-xs font-medium text-emerald-700">
                      ● online
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-neutral-600">
                  {r.users?.phone ?? r.users?.email ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-neutral-600">
                  {r.vehicle_type ?? "—"}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">
                  {r.cnic ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-2">
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
                  </div>
                </td>
              </tr>
            ))}
            {riders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  No riders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

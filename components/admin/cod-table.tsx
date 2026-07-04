"use client";

import { useState, useTransition } from "react";
import { settleAllForRider, settleLedgerRow } from "@/app/actions/admin";
import type { AdminLedgerRow } from "@/lib/db/admin";
import { formatPrice } from "@/types";

export function CodTable({ ledger }: { ledger: AdminLedgerRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function settleRow(id: string) {
    setError(null);
    startTransition(async () => {
      const r = await settleLedgerRow(id);
      if (r.error) setError(r.error);
    });
  }

  function settleRider(riderId: string, name: string, amount: number) {
    if (
      !window.confirm(
        `Confirm you collected ${formatPrice(amount)} from ${name}?`
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const r = await settleAllForRider(riderId);
      if (r.error) setError(r.error);
    });
  }

  // Group unsettled by rider for the settlement summary.
  const unsettled = ledger.filter((l) => !l.is_settled);
  const byRider = new Map<
    string,
    { name: string; total: number; count: number }
  >();
  for (const l of unsettled) {
    const id = l.riders?.id ?? "unknown";
    const cur = byRider.get(id) ?? {
      name: l.riders?.users?.full_name ?? "Rider",
      total: 0,
      count: 0,
    };
    cur.total += Number(l.amount_owed_to_platform);
    cur.count += 1;
    byRider.set(id, cur);
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <h2 className="text-lg font-bold text-neutral-900">Owed by rider</h2>
      {byRider.size === 0 ? (
        <p className="mt-2 text-sm text-neutral-400">
          All settled — no cash outstanding.
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...byRider.entries()].map(([riderId, info]) => (
            <div
              key={riderId}
              className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-neutral-200"
            >
              <h3 className="font-semibold text-neutral-900">{info.name}</h3>
              <p className="mt-1 text-2xl font-bold text-amber-700">
                {formatPrice(info.total)}
              </p>
              <p className="text-xs text-neutral-500">
                {info.count} unsettled deliveries
              </p>
              <button
                onClick={() => settleRider(riderId, info.name, info.total)}
                disabled={pending}
                className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                Mark all settled
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-lg font-bold text-neutral-900">Ledger entries</h2>
      <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-neutral-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Order</th>
              <th className="px-4 py-2.5 font-medium">Rider</th>
              <th className="px-4 py-2.5 text-right font-medium">Collected</th>
              <th className="px-4 py-2.5 text-right font-medium">Owed</th>
              <th className="px-4 py-2.5 text-right font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((l) => (
              <tr key={l.id} className="border-t border-neutral-100">
                <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">
                  #{l.order_id.slice(0, 8)}
                </td>
                <td className="px-4 py-2.5">
                  {l.riders?.users?.full_name ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {formatPrice(l.amount_collected)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {formatPrice(l.amount_owed_to_platform)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      l.is_settled
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {l.is_settled ? "Settled" : "Unsettled"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {!l.is_settled && (
                    <button
                      onClick={() => settleRow(l.id)}
                      disabled={pending}
                      className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                    >
                      Settle
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {ledger.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  No COD entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

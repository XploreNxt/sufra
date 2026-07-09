"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveMenuItem, rejectMenuItem } from "@/app/actions/admin";
import type { PendingMenuItem } from "@/lib/db/admin";
import { formatPrice } from "@/types";

export function MenuApprovals({ items }: { items: PendingMenuItem[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  function approve(id: string) {
    setError(null);
    start(async () => {
      const r = await approveMenuItem(id);
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  function reject(id: string) {
    if (!reason.trim()) {
      setError("Please write a reason so the vendor knows what to fix");
      return;
    }
    setError(null);
    start(async () => {
      const r = await rejectMenuItem(id, reason);
      if (r.error) setError(r.error);
      else {
        setRejecting(null);
        setReason("");
        router.refresh();
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-stone-200">
        <p className="text-3xl">✅</p>
        <p className="mt-2 font-semibold text-stone-800">All caught up</p>
        <p className="mt-1 text-sm text-stone-500">
          No menu items are waiting for review.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200"
          >
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt={item.name}
                className="h-40 w-full object-cover"
              />
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-stone-100 text-4xl text-stone-300">
                🍽️
              </div>
            )}
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {item.restaurants?.name ?? "Restaurant"}
                {item.menu_categories?.name
                  ? ` · ${item.menu_categories.name}`
                  : ""}
              </p>
              <h3 className="mt-0.5 flex items-center justify-between gap-2 font-bold text-stone-900">
                {item.name}
                <span className="whitespace-nowrap">
                  {formatPrice(item.price)}
                </span>
              </h3>
              {item.description && (
                <p className="mt-1 text-sm text-stone-500">{item.description}</p>
              )}

              {rejecting === item.id ? (
                <div className="mt-3">
                  <textarea
                    autoFocus
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="Reason (the vendor will see this) — e.g. photo is blurry, price looks wrong"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => reject(item.id)}
                      disabled={pending}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      Confirm reject
                    </button>
                    <button
                      onClick={() => {
                        setRejecting(null);
                        setReason("");
                      }}
                      className="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:text-stone-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => approve(item.id)}
                    disabled={pending}
                    className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setRejecting(item.id);
                      setReason("");
                      setError(null);
                    }}
                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

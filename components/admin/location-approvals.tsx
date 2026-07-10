"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveRestaurantLocation,
  rejectRestaurantLocation,
} from "@/app/actions/admin";
import type { PendingLocation } from "@/lib/db/admin";
import { MapPicker } from "@/components/map-picker";
import { haversineKm, formatDistance } from "@/lib/geo";

export function LocationApprovals({ items }: { items: PendingLocation[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  if (items.length === 0) return null;

  function approve(id: string) {
    setError(null);
    start(async () => {
      const r = await approveRestaurantLocation(id);
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  function reject(id: string) {
    if (!reason.trim()) {
      setError("Please write a reason for the vendor");
      return;
    }
    setError(null);
    start(async () => {
      const r = await rejectRestaurantLocation(id, reason);
      if (r.error) setError(r.error);
      else {
        setRejecting(null);
        setReason("");
        router.refresh();
      }
    });
  }

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-stone-900">Location pins</h2>
      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-3 space-y-3">
        {items.map((r) => {
          const moved =
            r.lat != null && r.lng != null
              ? haversineKm(r.lat, r.lng, r.pending_lat, r.pending_lng)
              : null;
          return (
            <div
              key={r.id}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200"
            >
              <p className="font-bold text-stone-900">{r.name}</p>
              {r.address_text && (
                <p className="text-xs text-stone-500">{r.address_text}</p>
              )}
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_16rem]">
                <MapPicker
                  lat={r.pending_lat}
                  lng={r.pending_lng}
                  radiusKm={r.delivery_radius_km}
                  className="h-56 w-full overflow-hidden rounded-xl ring-1 ring-stone-200"
                />
                <div className="text-sm text-stone-600">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                    Proposed pin
                  </p>
                  <p className="font-mono text-xs">
                    {r.pending_lat.toFixed(5)}, {r.pending_lng.toFixed(5)}
                  </p>
                  <p className="mt-2 text-xs text-stone-500">
                    Delivery radius: {Number(r.delivery_radius_km)} km
                  </p>
                  {r.lat == null ? (
                    <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
                      First pin — restaurant is currently hidden from customers.
                    </p>
                  ) : moved != null ? (
                    <p className="mt-2 text-xs text-stone-500">
                      Moves {formatDistance(moved)} from the current pin.
                    </p>
                  ) : null}
                </div>
              </div>

              {rejecting === r.id ? (
                <div className="mt-3">
                  <textarea
                    autoFocus
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="Reason the vendor will see"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => reject(r.id)}
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
                    onClick={() => approve(r.id)}
                    disabled={pending}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Approve pin
                  </button>
                  <button
                    onClick={() => {
                      setRejecting(r.id);
                      setReason("");
                      setError(null);
                    }}
                    className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

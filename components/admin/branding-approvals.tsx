"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveRestaurantBranding,
  rejectRestaurantBranding,
} from "@/app/actions/admin";
import type { PendingBranding } from "@/lib/db/admin";

function Thumb({ src, label }: { src: string | null; label: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        {label}
      </p>
      <div className="mt-1 h-20 w-28 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            —
          </div>
        )}
      </div>
    </div>
  );
}

export function BrandingApprovals({ items }: { items: PendingBranding[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  if (items.length === 0) return null;

  function approve(id: string) {
    setError(null);
    start(async () => {
      const r = await approveRestaurantBranding(id);
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
      const r = await rejectRestaurantBranding(id, reason);
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
      <h2 className="text-lg font-bold text-stone-900">Restaurant branding</h2>
      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-3 space-y-3">
        {items.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200"
          >
            <p className="font-bold text-stone-900">{r.name}</p>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              {r.pending_logo_url && (
                <>
                  <Thumb src={r.logo_url} label="Logo now" />
                  <span className="pb-8 text-stone-400">→</span>
                  <Thumb src={r.pending_logo_url} label="New logo" />
                </>
              )}
              {r.pending_cover_url && (
                <>
                  <Thumb src={r.cover_url} label="Cover now" />
                  <span className="pb-8 text-stone-400">→</span>
                  <Thumb src={r.pending_cover_url} label="New cover" />
                </>
              )}
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
                  Approve
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
        ))}
      </div>
    </section>
  );
}

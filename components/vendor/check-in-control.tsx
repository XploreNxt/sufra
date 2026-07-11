"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RestaurantHours } from "@/types";
import { checkInRestaurant, setRestaurantOpen } from "@/app/actions/vendor";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

// Today's close time as a UTC ISO string, computed in the vendor's own
// timezone. null → no auto-close (no hours today, or close already passed).
function computeOpenUntil(hours: RestaurantHours | null): {
  iso: string | null;
  closeLabel: string | null;
} {
  if (!hours) return { iso: null, closeLabel: null };
  const now = new Date();
  const day = hours[DAY_KEYS[now.getDay()]];
  if (!day || day.closed || !day.close) return { iso: null, closeLabel: null };
  const [h, m] = day.close.split(":").map(Number);
  const close = new Date(now);
  close.setHours(h, m || 0, 0, 0);
  if (close <= now) return { iso: null, closeLabel: null };
  return { iso: close.toISOString(), closeLabel: day.close };
}

function fmtTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CheckInControl({
  restaurantId,
  isOpen,
  openUntil,
  hours,
}: {
  restaurantId: string;
  isOpen: boolean;
  openUntil: string | null;
  hours: RestaurantHours | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function checkIn() {
    setError(null);
    const { iso } = computeOpenUntil(hours);
    start(async () => {
      const r = await checkInRestaurant(restaurantId, iso);
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  function closeNow() {
    setError(null);
    start(async () => {
      const r = await setRestaurantOpen(restaurantId, false);
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  if (isOpen) {
    const until = fmtTime(openUntil);
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-800">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          Open{until ? ` · till ${until}` : ""}
        </span>
        <button
          onClick={closeNow}
          disabled={pending}
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Close now
        </button>
      </div>
    );
  }

  const { closeLabel } = computeOpenUntil(hours);
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={checkIn}
        disabled={pending}
        title={closeLabel ? `Auto-closes at ${closeLabel}` : "Opens until you close"}
        className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
      >
        {pending ? "Checking in…" : "✅ Check in to open"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

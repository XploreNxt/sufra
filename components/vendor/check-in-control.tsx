"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RestaurantHours } from "@/types";
import { checkInRestaurant, setRestaurantOpen } from "@/app/actions/vendor";
import {
  isWithinBusinessHours,
  todayCloseUtcISO,
  nextOpeningLabel,
} from "@/lib/hours";

function fmtUntil(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: "Asia/Karachi",
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
    if (!isWithinBusinessHours(hours)) {
      setError("You can only check in during your business hours.");
      return;
    }
    const iso = todayCloseUtcISO(hours);
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
    const until = fmtUntil(openUntil);
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

  // Closed — check-in only allowed inside business hours.
  const canCheckIn = isWithinBusinessHours(hours);
  if (canCheckIn) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={checkIn}
          disabled={pending}
          className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
        >
          {pending ? "Checking in…" : "✅ Check in to open"}
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  const next = nextOpeningLabel(hours);
  return (
    <span className="flex items-center gap-2 rounded-full bg-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-600">
      <span className="h-2.5 w-2.5 rounded-full bg-stone-500" />
      Closed{next ? ` · ${next}` : ""}
    </span>
  );
}

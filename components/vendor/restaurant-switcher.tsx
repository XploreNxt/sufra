"use client";

import { useTransition } from "react";
import { setActiveRestaurant } from "@/app/actions/vendor";

export function RestaurantSwitcher({
  restaurants,
  activeId,
}: {
  restaurants: Array<{ id: string; name: string }>;
  activeId: string;
}) {
  const [pending, startTransition] = useTransition();

  if (restaurants.length <= 1) return null;

  return (
    <select
      value={activeId}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => setActiveRestaurant(e.target.value))
      }
      className="max-w-44 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm font-medium text-neutral-800"
    >
      {restaurants.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
    </select>
  );
}

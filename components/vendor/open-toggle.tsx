"use client";

import { useState, useTransition } from "react";
import { setRestaurantOpen } from "@/app/actions/vendor";

export function OpenToggle({
  restaurantId,
  isOpen,
}: {
  restaurantId: string;
  isOpen: boolean;
}) {
  const [open, setOpen] = useState(isOpen);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !open;
    setOpen(next);
    startTransition(async () => {
      const { error } = await setRestaurantOpen(restaurantId, next);
      if (error) setOpen(!next); // roll back on failure
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
        open
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
          : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${open ? "bg-emerald-600" : "bg-neutral-500"}`}
      />
      {open ? "Open" : "Closed"}
    </button>
  );
}

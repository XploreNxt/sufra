"use client";

import { useState, useTransition } from "react";
import { setRiderOnline } from "@/app/actions/rider";

export function RiderOnlineToggle({ isOnline }: { isOnline: boolean }) {
  const [online, setOnline] = useState(isOnline);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !online;
    setOnline(next);
    startTransition(async () => {
      const { error } = await setRiderOnline(next);
      if (error) setOnline(!next);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
        online
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
          : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-600" : "bg-neutral-500"}`}
      />
      {online ? "Online" : "Offline"}
    </button>
  );
}

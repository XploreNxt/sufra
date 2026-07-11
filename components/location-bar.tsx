"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearCustomerLocation } from "@/app/actions/location";
import { shortLabel } from "@/lib/geo";

export function LocationBar({ label }: { label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function change() {
    start(async () => {
      await clearCustomerLocation();
      router.refresh();
    });
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-stone-200">
      <span className="min-w-0 truncate text-sm text-stone-700">
        📍 Delivering to{" "}
        <span className="font-semibold">{shortLabel(label)}</span>
      </span>
      <button
        onClick={change}
        disabled={pending}
        className="shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
      >
        {pending ? "…" : "Change"}
      </button>
    </div>
  );
}

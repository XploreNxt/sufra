"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { RangeKey } from "@/lib/datetime";

const PRESETS: Array<{ key: RangeKey; label: string }> = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "custom", label: "Custom" },
];

export function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const current = (sp.get("range") ?? "all") as RangeKey;
  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");

  function apply(next: Partial<{ range: RangeKey; from: string; to: string }>) {
    const params = new URLSearchParams(sp.toString());
    const range = next.range ?? current;

    if (range === "all") params.delete("range");
    else params.set("range", range);

    if (range === "custom") {
      const f = next.from ?? from;
      const t = next.to ?? to;
      if (f) params.set("from", f);
      else params.delete("from");
      if (t) params.set("to", t);
      else params.delete("to");
    } else {
      params.delete("from");
      params.delete("to");
    }

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mb-5">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => apply({ range: p.key })}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              current === p.key
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {current === "custom" && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="block text-xs font-semibold text-stone-500">
              From
            </span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 rounded-lg border border-stone-300 px-3 py-1.5"
            />
          </label>
          <label className="text-sm">
            <span className="block text-xs font-semibold text-stone-500">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 rounded-lg border border-stone-300 px-3 py-1.5"
            />
          </label>
          <button
            onClick={() => apply({ range: "custom", from, to })}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

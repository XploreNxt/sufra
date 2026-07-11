"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant } from "@/types";
import { CUISINE_OPTIONS, SPICE_LEVELS } from "@/types";
import { updateShopProfile } from "@/app/actions/shop";

export function ShopProfile({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const [cuisines, setCuisines] = useState<string[]>(restaurant.cuisine_types ?? []);
  const [spice, setSpice] = useState<string[]>(restaurant.spice_levels ?? []);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Show the standard list plus any custom cuisines already on the shop.
  const allCuisines = Array.from(new Set([...CUISINE_OPTIONS, ...cuisines]));

  function toggle(list: string[], setList: (v: string[]) => void, v: string) {
    setOk(false);
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  function save() {
    setErr(null);
    setOk(false);
    start(async () => {
      const r = await updateShopProfile(restaurant.id, {
        cuisine_types: cuisines,
        spice_levels: spice,
      });
      if (r.error) setErr(r.error);
      else {
        setOk(true);
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <h2 className="font-bold text-stone-900">Cuisines &amp; spice</h2>
      <p className="mt-1 text-xs text-stone-500">
        Saved instantly. Cuisines help customers find you; spice levels are
        offered to customers at checkout.
      </p>

      <div className="mt-4">
        <p className="text-xs font-semibold text-stone-600">Cuisines you serve</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {allCuisines.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggle(cuisines, setCuisines, c)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                cuisines.includes(c)
                  ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold text-stone-600">Spice levels offered</p>
        <p className="text-[11px] text-stone-400">
          Pick all you can make. Leave empty if spice isn’t a choice at your shop.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SPICE_LEVELS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(spice, setSpice, s.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
                spice.includes(s.key)
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {err && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
      )}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {ok && <span className="text-sm font-medium text-emerald-700">✓ Saved</span>}
      </div>
    </section>
  );
}

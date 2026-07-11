"use client";

import { useMemo, useState } from "react";
import type { Restaurant } from "@/types";
import { RestaurantCard } from "@/components/restaurant-card";
import { romanUrduMatch } from "@/lib/search";

export function RestaurantFeed({
  restaurants,
  favoriteCuisines = [],
}: {
  restaurants: Restaurant[];
  favoriteCuisines?: string[];
}) {
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState<string | null>(null);

  // Build the chip list from cuisines actually present in the feed — most
  // common first, with the customer's favourites pinned to the front.
  const cuisines = useMemo(() => {
    const count = new Map<string, number>();
    for (const r of restaurants) {
      for (const c of r.cuisine_types) {
        const key = c.trim();
        if (key) count.set(key, (count.get(key) ?? 0) + 1);
      }
    }
    const fav = new Set(favoriteCuisines.map((c) => c.toLowerCase()));
    return [...count.keys()].sort((a, b) => {
      const fa = fav.has(a.toLowerCase());
      const fb = fav.has(b.toLowerCase());
      if (fa !== fb) return fa ? -1 : 1;
      return count.get(b)! - count.get(a)! || a.localeCompare(b);
    });
  }, [restaurants, favoriteCuisines]);

  const q = query.trim();
  const filtered = restaurants.filter((r) => {
    const matchesQuery =
      !q ||
      romanUrduMatch(q, r.name) ||
      r.cuisine_types.some((c) => romanUrduMatch(q, c));
    const matchesCuisine =
      !cuisine ||
      r.cuisine_types.some((c) => c.toLowerCase() === cuisine.toLowerCase());
    return matchesQuery && matchesCuisine;
  });

  const chip = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
      active
        ? "bg-emerald-600 text-white shadow-sm"
        : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
    }`;

  return (
    <div>
      {/* Hero */}
      <section className="s-fade-up s-pattern relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 px-6 py-10 shadow-lg shadow-emerald-900/20 sm:px-10 sm:py-14">
        <span className="s-float absolute -right-4 top-4 select-none text-[7rem] opacity-20 sm:right-8 sm:text-[9rem] sm:opacity-40">
          🍛
        </span>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-200">
          Bhook lagi hai?
        </p>
        <h1 className="mt-2 max-w-md text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
          The dastarkhwan is set.
        </h1>
        <p className="mt-2 max-w-sm text-sm font-medium text-emerald-100">
          {restaurants.length} {restaurants.length === 1 ? "kitchen" : "kitchens"}{" "}
          delivering near you — cash on delivery, tracked live.
        </p>

        <div className="relative mt-6 max-w-md">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
            🔍
          </span>
          <input
            type="search"
            placeholder="Biryani, chargha, burger…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border-0 bg-white/95 py-3.5 pl-11 pr-4 font-medium text-stone-900 shadow-xl shadow-emerald-950/20 outline-none ring-emerald-300 backdrop-blur transition-all placeholder:text-stone-400 focus:bg-white focus:ring-4"
          />
        </div>
      </section>

      {/* Cuisine filter */}
      {cuisines.length > 0 && (
        <div className="s-fade mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setCuisine(null)}
            className={chip(cuisine === null)}
          >
            All
          </button>
          {cuisines.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCuisine((cur) => (cur === c ? null : c))}
              className={chip(cuisine === c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="s-fade-up mt-14 text-center">
          <p className="text-5xl">🫥</p>
          <p className="mt-3 font-semibold text-stone-700">
            {q
              ? `Nothing matches “${q}”`
              : cuisine
                ? `No ${cuisine} kitchens deliver here yet`
                : "No kitchens here yet"}
          </p>
          {(q || cuisine) && (
            <button
              onClick={() => {
                setQuery("");
                setCuisine(null);
              }}
              className="mt-3 rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              Show all
            </button>
          )}
        </div>
      ) : (
        <div className="s-stagger mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}

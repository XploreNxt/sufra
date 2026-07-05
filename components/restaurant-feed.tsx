"use client";

import { useState } from "react";
import type { Restaurant } from "@/types";
import { RestaurantCard } from "@/components/restaurant-card";
import { romanUrduMatch } from "@/lib/search";

export function RestaurantFeed({ restaurants }: { restaurants: Restaurant[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim();
  const filtered = q
    ? restaurants.filter(
        (r) =>
          romanUrduMatch(q, r.name) ||
          r.cuisine_types.some((c) => romanUrduMatch(q, c))
      )
    : restaurants;

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
          {restaurants.length} kitchens delivering near you — cash on delivery,
          tracked live.
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

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="s-fade-up mt-14 text-center">
          <p className="text-5xl">🫥</p>
          <p className="mt-3 font-semibold text-stone-700">
            Nothing matches “{query}”
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Try “biryani”, “bbq” or “burger”.
          </p>
        </div>
      ) : (
        <div className="s-stagger mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}

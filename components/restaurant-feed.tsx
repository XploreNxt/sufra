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
      <input
        type="search"
        placeholder="Search restaurants or cuisines…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-neutral-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-neutral-500">
          No restaurants match “{query}”.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}

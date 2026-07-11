"use client";

import { useState, useTransition } from "react";
import { searchPlaces, type PlaceHit } from "@/app/actions/geocode";

/**
 * Reusable place search (Nominatim, proxied through a server action). On
 * pick it hands back the coordinates + a human-readable label; the parent
 * decides what to do (move a map pin, fill an address field, etc.).
 */
export function LocationSearch({
  onPick,
  placeholder = "Search area or landmark, e.g. Gulshan-e-Iqbal",
}: {
  onPick: (lat: number, lng: number, label: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searching, start] = useTransition();

  function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setError(null);
    start(async () => {
      const r = await searchPlaces(q);
      if (r.error) {
        setError("Search failed — try again.");
        return;
      }
      const hits = r.hits ?? [];
      setResults(hits);
      if (hits.length === 0)
        setError("No matches — try a nearby area or landmark.");
    });
  }

  function pick(h: PlaceHit) {
    onPick(h.lat, h.lng, h.label);
    setResults([]);
    setQuery(h.label.split(",")[0]);
  }

  return (
    <div>
      <form onSubmit={search} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
        <button
          type="submit"
          disabled={searching}
          className="shrink-0 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
        >
          {searching ? "…" : "Search"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-stone-500">{error}</p>}
      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-stone-100 overflow-hidden rounded-xl ring-1 ring-stone-200">
          {results.map((h, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(h)}
                className="block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-emerald-50"
              >
                {h.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

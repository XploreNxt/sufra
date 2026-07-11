"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPicker } from "@/components/map-picker";
import { DEFAULT_CENTER } from "@/lib/geo";
import { setCustomerLocation } from "@/app/actions/location";
import { searchPlaces, type PlaceHit } from "@/app/actions/geocode";

async function reverseLabel(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { "Accept-Language": "en" } }
    );
    const j = await res.json();
    return j?.display_name ?? "Pinned location";
  } catch {
    return "Pinned location";
  }
}

export function LocationGate() {
  const router = useRouter();
  const [pos, setPos] = useState(DEFAULT_CENTER);
  const [label, setLabel] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();

  function locateMe() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Your browser can't share location — search or drag the pin.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLabel("");
        setResults([]);
      },
      (e) => {
        setLocating(false);
        setError(
          e.code === e.PERMISSION_DENIED
            ? "Location permission denied — search or drag the pin instead."
            : "Couldn't get your location — search or drag the pin instead."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setError(null);
    setSearching(true);
    const r = await searchPlaces(q);
    setSearching(false);
    if (r.error) {
      setError("Search failed — try again or drag the pin.");
      return;
    }
    const hits = r.hits ?? [];
    setResults(hits);
    if (hits.length === 0) setError("No matches — try a nearby area or landmark.");
  }

  function pickHit(h: PlaceHit) {
    setPos({ lat: h.lat, lng: h.lng });
    setLabel(h.label);
    setResults([]);
    setQuery(h.label.split(",")[0]);
  }

  function confirm() {
    setError(null);
    start(async () => {
      const finalLabel = label || (await reverseLabel(pos.lat, pos.lng));
      const res = await setCustomerLocation({
        lat: pos.lat,
        lng: pos.lng,
        label: finalLabel,
      });
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="s-fade-up rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
        <p className="text-3xl">📍</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900">
          Where should we deliver?
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          We’ll show you kitchens that deliver to your spot. Use your current
          location, search an area, or drag the pin.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
          >
            {locating ? "Locating…" : "📍 Use my current location"}
          </button>
        </div>

        <form onSubmit={search} className="mt-3 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search area, e.g. Gulshan-e-Iqbal, Karachi"
            className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
          >
            {searching ? "…" : "Search"}
          </button>
        </form>

        {results.length > 0 && (
          <ul className="mt-2 divide-y divide-stone-100 overflow-hidden rounded-xl ring-1 ring-stone-200">
            {results.map((h, i) => (
              <li key={i}>
                <button
                  onClick={() => pickHit(h)}
                  className="block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-emerald-50"
                >
                  {h.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        <MapPicker
          lat={pos.lat}
          lng={pos.lng}
          draggable
          onChange={(lat, lng) => {
            setPos({ lat, lng });
            setLabel("");
          }}
          className="mt-4 h-64 w-full overflow-hidden rounded-xl ring-1 ring-stone-200"
        />
        {label && (
          <p className="mt-2 line-clamp-2 text-xs text-stone-500">{label}</p>
        )}

        <button
          onClick={confirm}
          disabled={saving}
          className="mt-4 w-full rounded-xl bg-stone-900 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-stone-800 active:scale-95 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Confirm this location"}
        </button>
      </div>
    </div>
  );
}

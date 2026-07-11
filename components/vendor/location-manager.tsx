"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant } from "@/types";
import { MapPicker } from "@/components/map-picker";
import { LocationSearch } from "@/components/location-search";
import { DEFAULT_CENTER } from "@/lib/geo";
import { submitRestaurantPin, updateDeliveryRadius } from "@/app/actions/shop";

export function LocationManager({ restaurant: r }: { restaurant: Restaurant }) {
  const router = useRouter();

  // Map pin: prefer the pending (unreviewed) pin, else the live one, else Karachi.
  const initial =
    r.pending_lat != null && r.pending_lng != null
      ? { lat: r.pending_lat, lng: r.pending_lng }
      : r.lat != null && r.lng != null
        ? { lat: r.lat, lng: r.lng }
        : DEFAULT_CENTER;

  const [pos, setPos] = useState(initial);
  const [moved, setMoved] = useState(false);
  const [radius, setRadius] = useState(String(r.delivery_radius_km));
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinOk, setPinOk] = useState(false);
  const [radiusOk, setRadiusOk] = useState(false);
  const [pending, start] = useTransition();

  const hasLivePin = r.lat != null && r.lng != null;
  const hasPendingPin = r.pending_lat != null && r.pending_lng != null;

  function locateMe() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Your browser can't share location — drag the pin instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setMoved(true);
      },
      (e) => {
        setLocating(false);
        setError(
          e.code === e.PERMISSION_DENIED
            ? "Location permission denied — drag the pin to your shop instead."
            : "Couldn't get your location — drag the pin instead."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function submitPin() {
    setError(null);
    setPinOk(false);
    start(async () => {
      const res = await submitRestaurantPin(r.id, pos);
      if (res.error) setError(res.error);
      else {
        setPinOk(true);
        setMoved(false);
        router.refresh();
      }
    });
  }

  function saveRadius() {
    setError(null);
    setRadiusOk(false);
    const km = Number(radius);
    start(async () => {
      const res = await updateDeliveryRadius(r.id, km);
      if (res.error) setError(res.error);
      else {
        setRadiusOk(true);
        router.refresh();
      }
    });
  }

  const radiusNum = Number(radius);
  const radiusValid = Number.isFinite(radiusNum) && radiusNum >= 1 && radiusNum <= 50;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <h2 className="font-bold text-stone-900">Location &amp; delivery area</h2>
      <p className="mt-1 text-xs text-stone-500">
        Drop your exact shop pin — customers only see you if they fall inside your
        delivery radius. Pin changes are reviewed by Sufra; the radius saves
        instantly.
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {!hasLivePin && !hasPendingPin && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          ⚠️ Your restaurant is hidden from customers until you set a pin and it’s
          approved.
        </p>
      )}
      {hasPendingPin && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Your pin change is awaiting admin review.
          {hasLivePin && " Your current pin stays live until then."}
        </p>
      )}
      {r.location_rejection_reason && !hasPendingPin && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Last pin change rejected: {r.location_rejection_reason}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
        >
          {locating ? "Locating…" : "📍 Locate me"}
        </button>
        <span className="text-xs text-stone-400">
          search, drag the pin, or tap the map
        </span>
      </div>

      <div className="mt-3">
        <LocationSearch
          placeholder="Search your shop area or landmark"
          onPick={(lat, lng) => {
            setPos({ lat, lng });
            setMoved(true);
          }}
        />
      </div>

      <MapPicker
        lat={pos.lat}
        lng={pos.lng}
        radiusKm={radiusValid ? radiusNum : undefined}
        draggable
        onChange={(lat, lng) => {
          setPos({ lat, lng });
          setMoved(true);
        }}
        className="mt-3 h-72 w-full overflow-hidden rounded-xl ring-1 ring-stone-200"
      />

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
        <span>
          Pin: {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
        </span>
      </div>

      {pinOk && (
        <p className="mt-3 text-sm font-medium text-emerald-700">
          ✓ Pin sent for review.
        </p>
      )}
      <div className="mt-3">
        <button
          onClick={submitPin}
          disabled={pending || !moved}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit pin for review"}
        </button>
      </div>

      {/* Radius */}
      <div className="mt-6 border-t border-stone-100 pt-5">
        <h3 className="text-sm font-bold text-stone-900">Delivery radius</h3>
        <p className="mt-1 text-xs text-stone-500">
          How far you deliver from your pin. Saved instantly.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={50}
              step={0.5}
              value={radius}
              onChange={(e) => {
                setRadius(e.target.value);
                setRadiusOk(false);
              }}
              className="w-24 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
            <span className="text-sm text-stone-600">km</span>
          </div>
          <button
            onClick={saveRadius}
            disabled={pending || !radiusValid}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-stone-800 active:scale-95 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save radius"}
          </button>
          {radiusOk && (
            <span className="text-sm font-medium text-emerald-700">✓ Saved</span>
          )}
        </div>
      </div>
    </section>
  );
}

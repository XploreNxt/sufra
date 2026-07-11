"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPicker } from "@/components/map-picker";
import { LocationSearch } from "@/components/location-search";
import { DEFAULT_CENTER } from "@/lib/geo";
import { createAddress } from "@/app/actions/orders";
import {
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/app/actions/addresses";

export interface SavedAddress {
  id: string;
  label: string | null;
  address_text: string | null;
  landmark: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
}

const field =
  "mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const label = "text-xs font-semibold text-stone-600";

async function reverseFill(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { "Accept-Language": "en" } }
    );
    const j = await res.json();
    const a = j?.address ?? {};
    return (
      [a.house_number, a.road, a.neighbourhood ?? a.suburb, a.city ?? a.town ?? a.village]
        .filter(Boolean)
        .join(", ") ||
      j?.display_name ||
      ""
    );
  } catch {
    return "";
  }
}

function AddressForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: SavedAddress;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [labelText, setLabelText] = useState(initial?.label ?? "Home");
  const [addressText, setAddressText] = useState(initial?.address_text ?? "");
  const [landmark, setLandmark] = useState(initial?.landmark ?? "");
  const [pos, setPos] = useState({
    lat: initial?.lat ?? DEFAULT_CENTER.lat,
    lng: initial?.lng ?? DEFAULT_CENTER.lng,
  });
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function locateMe() {
    setErr(null);
    if (!navigator.geolocation) {
      setErr("Your browser can't share location — drag the pin instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        setPos({ lat, lng });
        const line = await reverseFill(lat, lng);
        if (line) setAddressText(line);
        setLocating(false);
      },
      (e) => {
        setLocating(false);
        setErr(
          e.code === e.PERMISSION_DENIED
            ? "Location permission denied — drag the pin or type your address."
            : "Couldn't get your location — drag the pin instead."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function submit() {
    setErr(null);
    if (!addressText.trim()) {
      setErr("Address is required");
      return;
    }
    const input = {
      label: labelText,
      address_text: addressText,
      landmark,
      city: initial?.city ?? "Karachi",
      lat: pos.lat,
      lng: pos.lng,
    };
    start(async () => {
      const r = initial
        ? await updateAddress(initial.id, input)
        : await createAddress(input);
      if ("error" in r && r.error) setErr(r.error);
      else onDone();
    });
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Label</span>
          <select
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            className={field}
          >
            <option>Home</option>
            <option>Work</option>
            <option>Other</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className="w-full rounded-xl border border-emerald-600 px-3 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          >
            {locating ? "Locating…" : "📍 Use my location"}
          </button>
        </div>
        <label className="block sm:col-span-2">
          <span className={label}>Complete address</span>
          <input
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            placeholder="House #, street, area"
            className={field}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={label}>Nearest landmark</span>
          <input
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="e.g. opposite Imtiaz Store"
            className={field}
          />
        </label>
      </div>

      <div className="mt-3">
        <LocationSearch
          onPick={(lat, lng, labelText) => {
            setPos({ lat, lng });
            if (!addressText.trim()) setAddressText(labelText);
          }}
        />
      </div>

      <MapPicker
        lat={pos.lat}
        lng={pos.lng}
        draggable
        onChange={(lat, lng) => setPos({ lat, lng })}
        className="mt-3 h-56 w-full overflow-hidden rounded-xl ring-1 ring-stone-200"
      />

      {err && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
      )}
      <div className="mt-4 flex gap-2">
        <button
          onClick={submit}
          disabled={pending}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
        >
          {pending ? "Saving…" : initial ? "Save address" : "Add address"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl px-4 py-2.5 text-sm text-stone-500 hover:text-stone-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function AddressBook({ addresses }: { addresses: SavedAddress[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, start] = useTransition();

  function refresh() {
    setAdding(false);
    setEditing(null);
    router.refresh();
  }

  function makeDefault(id: string) {
    start(async () => {
      await setDefaultAddress(id);
      router.refresh();
    });
  }
  function remove(id: string) {
    start(async () => {
      await deleteAddress(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {addresses.map((a) =>
        editing === a.id ? (
          <AddressForm
            key={a.id}
            initial={a}
            onDone={refresh}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div
            key={a.id}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-stone-900">
                  {a.label ?? "Address"}
                  {a.is_default && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      Default
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-stone-600">{a.address_text}</p>
                {a.landmark && (
                  <p className="text-xs text-stone-400">Near {a.landmark}</p>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {!a.is_default && (
                <button
                  onClick={() => makeDefault(a.id)}
                  disabled={busy}
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                >
                  Set default
                </button>
              )}
              <button
                onClick={() => setEditing(a.id)}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"
              >
                Edit
              </button>
              <button
                onClick={() => remove(a.id)}
                disabled={busy}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        )
      )}

      {adding ? (
        <AddressForm onDone={refresh} onCancel={() => setAdding(false)} />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-2xl border-2 border-dashed border-stone-300 px-4 py-4 text-sm font-semibold text-stone-500 hover:border-emerald-400 hover:text-emerald-700"
        >
          + Add a new address
        </button>
      )}
    </div>
  );
}

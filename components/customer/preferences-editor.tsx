"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types";
import { SPICE_LEVELS, CUISINE_OPTIONS } from "@/types";
import { updatePreferences } from "@/app/actions/profile";

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2">
      <span>
        <span className="block text-sm font-semibold text-stone-800">{label}</span>
        <span className="block text-xs text-stone-500">{hint}</span>
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-emerald-600" : "bg-stone-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export function PreferencesEditor({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [spice, setSpice] = useState<string | null>(profile.default_spice);
  const [cuisines, setCuisines] = useState<string[]>(profile.favorite_cuisines ?? []);
  const [orderUpdates, setOrderUpdates] = useState(profile.notify_order_updates);
  const [promos, setPromos] = useState(profile.notify_promotions);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggleCuisine(c: string) {
    setOk(false);
    setCuisines((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function save() {
    setErr(null);
    setOk(false);
    start(async () => {
      const r = await updatePreferences({
        default_spice: spice,
        favorite_cuisines: cuisines,
        notify_order_updates: orderUpdates,
        notify_promotions: promos,
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
      <h2 className="font-bold text-stone-900">Preferences</h2>

      <div className="mt-4">
        <p className="text-xs font-semibold text-stone-600">Default spice level</p>
        <p className="text-[11px] text-stone-400">
          Pre-selected when a kitchen offers spice options.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSpice(null);
              setOk(false);
            }}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
              spice === null
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            No preference
          </button>
          {SPICE_LEVELS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setSpice(s.key);
                setOk(false);
              }}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
                spice === s.key
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold text-stone-600">Favourite cuisines</p>
        <p className="text-[11px] text-stone-400">
          We’ll show these kitchens first in your feed.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CUISINE_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCuisine(c)}
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

      <div className="mt-5 border-t border-stone-100 pt-3">
        <p className="text-xs font-semibold text-stone-600">Notifications</p>
        <Toggle
          checked={orderUpdates}
          onChange={(v) => {
            setOrderUpdates(v);
            setOk(false);
          }}
          label="Order updates"
          hint="Confirmed, preparing, on the way, delivered."
        />
        <Toggle
          checked={promos}
          onChange={(v) => {
            setPromos(v);
            setOk(false);
          }}
          label="Offers & promotions"
          hint="Deals and discounts from Sufra."
        />
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
          {pending ? "Saving…" : "Save preferences"}
        </button>
        {ok && <span className="text-sm font-medium text-emerald-700">✓ Saved</span>}
      </div>
    </section>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DAYS, defaultHours } from "@/types";
import type { Restaurant, RestaurantHours } from "@/types";
import {
  submitRestaurantBranding,
  updateRestaurantHours,
} from "@/app/actions/shop";

async function uploadImage(
  restaurantId: string,
  kind: "logo" | "cover",
  file: File,
  onError: (m: string) => void
): Promise<string | null> {
  if (!file.type.startsWith("image/")) {
    onError("Please choose an image file");
    return null;
  }
  if (file.size > 4 * 1024 * 1024) {
    onError("Image must be under 4 MB");
    return null;
  }
  const supabase = createClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `restaurants/${restaurantId}/${kind}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("menu-images")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) {
    onError(error.message);
    return null;
  }
  return supabase.storage.from("menu-images").getPublicUrl(path).data.publicUrl;
}

function ImageSlot({
  label,
  aspect,
  live,
  staged,
  pending,
  onPick,
  busy,
}: {
  label: string;
  aspect: string;
  live: string | null;
  staged: string | null; // just uploaded, not submitted
  pending: string | null; // awaiting admin review
  onPick: (file: File) => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const show = staged ?? pending ?? live;

  return (
    <div>
      <p className="text-sm font-semibold text-stone-700">{label}</p>
      <div
        className={`mt-1.5 overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200 ${aspect}`}
      >
        {show ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={show} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-stone-300">
            🖼️
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => ref.current?.click()}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Choose new"}
        </button>
        {staged && (
          <span className="text-xs font-semibold text-emerald-700">
            ✓ ready to submit
          </span>
        )}
        {!staged && pending && (
          <span className="text-xs font-semibold text-amber-700">
            awaiting review
          </span>
        )}
      </div>
    </div>
  );
}

export function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [logoBusy, setLogoBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [newLogo, setNewLogo] = useState<string | null>(null);
  const [newCover, setNewCover] = useState<string | null>(null);
  const [brandingOk, setBrandingOk] = useState(false);

  const [hours, setHours] = useState<RestaurantHours>(
    restaurant.hours ?? defaultHours()
  );
  const [hoursOk, setHoursOk] = useState(false);

  async function pickLogo(file: File) {
    setError(null);
    setLogoBusy(true);
    const url = await uploadImage(restaurant.id, "logo", file, setError);
    setLogoBusy(false);
    if (url) setNewLogo(url);
  }
  async function pickCover(file: File) {
    setError(null);
    setCoverBusy(true);
    const url = await uploadImage(restaurant.id, "cover", file, setError);
    setCoverBusy(false);
    if (url) setNewCover(url);
  }

  function submitBranding() {
    setError(null);
    setBrandingOk(false);
    start(async () => {
      const r = await submitRestaurantBranding(restaurant.id, {
        logo_url: newLogo,
        cover_url: newCover,
      });
      if (r.error) setError(r.error);
      else {
        setBrandingOk(true);
        setNewLogo(null);
        setNewCover(null);
        router.refresh();
      }
    });
  }

  function saveHours() {
    setError(null);
    setHoursOk(false);
    start(async () => {
      const r = await updateRestaurantHours(restaurant.id, hours);
      if (r.error) setError(r.error);
      else {
        setHoursOk(true);
        router.refresh();
      }
    });
  }

  function setDay(key: string, patch: Partial<RestaurantHours[keyof RestaurantHours]>) {
    setHoursOk(false);
    setHours((h) => ({ ...h, [key]: { ...h[key as keyof RestaurantHours], ...patch } }));
  }

  const hasPendingBranding =
    !!restaurant.pending_logo_url || !!restaurant.pending_cover_url;

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Locked details */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <h2 className="font-bold text-stone-900">Shop details</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-stone-500">Name</p>
            <p className="text-stone-900">{restaurant.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Address</p>
            <p className="text-stone-900">
              {restaurant.address_text ?? "—"}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-stone-400">
          🔒 Name and address can’t be changed here. Contact Sufra support to
          update them.
        </p>
      </section>

      {/* Branding */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <h2 className="font-bold text-stone-900">Logo &amp; cover photo</h2>
        <p className="mt-1 text-xs text-stone-500">
          New images are reviewed by Sufra before customers see them — your
          current ones stay live until then.
        </p>

        {hasPendingBranding && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            You have image changes awaiting admin review.
          </p>
        )}
        {restaurant.branding_rejection_reason && !hasPendingBranding && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Last change rejected: {restaurant.branding_rejection_reason}
          </p>
        )}

        <div className="mt-4 grid gap-5 sm:grid-cols-[10rem_1fr]">
          <ImageSlot
            label="Logo"
            aspect="aspect-square w-40"
            live={restaurant.logo_url}
            staged={newLogo}
            pending={restaurant.pending_logo_url}
            onPick={pickLogo}
            busy={logoBusy}
          />
          <ImageSlot
            label="Cover photo"
            aspect="aspect-[3/1]"
            live={restaurant.cover_url}
            staged={newCover}
            pending={restaurant.pending_cover_url}
            onPick={pickCover}
            busy={coverBusy}
          />
        </div>

        {brandingOk && (
          <p className="mt-3 text-sm font-medium text-emerald-700">
            ✓ Sent for review.
          </p>
        )}
        <div className="mt-4">
          <button
            onClick={submitBranding}
            disabled={pending || (!newLogo && !newCover)}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
          >
            {pending ? "Submitting…" : "Submit images for review"}
          </button>
        </div>
      </section>

      {/* Hours */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <h2 className="font-bold text-stone-900">Shop timings</h2>
        <p className="mt-1 text-xs text-stone-500">
          Saved instantly. Shown to customers; use the Open/Closed toggle in the
          header to actually start or stop taking orders.
        </p>
        <div className="mt-4 space-y-2">
          {DAYS.map(({ key, label }) => {
            const d = hours[key];
            return (
              <div
                key={key}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 px-3 py-2"
              >
                <span className="w-24 text-sm font-semibold text-stone-700">
                  {label}
                </span>
                <label className="flex items-center gap-1.5 text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={d.closed}
                    onChange={(e) => setDay(key, { closed: e.target.checked })}
                    className="accent-emerald-600"
                  />
                  Closed
                </label>
                {!d.closed && (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      value={d.open}
                      onChange={(e) => setDay(key, { open: e.target.value })}
                      className="rounded-lg border border-stone-300 px-2 py-1"
                    />
                    <span className="text-stone-400">to</span>
                    <input
                      type="time"
                      value={d.close}
                      onChange={(e) => setDay(key, { close: e.target.value })}
                      className="rounded-lg border border-stone-300 px-2 py-1"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {hoursOk && (
          <p className="mt-3 text-sm font-medium text-emerald-700">
            ✓ Timings saved.
          </p>
        )}
        <div className="mt-4">
          <button
            onClick={saveHours}
            disabled={pending}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save timings"}
          </button>
        </div>
      </section>
    </div>
  );
}

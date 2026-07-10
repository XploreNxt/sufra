"use client";

import { useState, useTransition } from "react";
import {
  setRestaurantStatus,
  updateRestaurantDetails,
} from "@/app/actions/admin";
import type { AdminRestaurant } from "@/lib/db/admin";
import { formatPrice } from "@/types";

const STATUS_STYLES: Record<AdminRestaurant["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  suspended: "bg-red-100 text-red-800",
};

export function VendorsTable({ restaurants }: { restaurants: AdminRestaurant[] }) {
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminRestaurant | null>(null);
  const [pending, startTransition] = useTransition();

  function changeStatus(id: string, status: AdminRestaurant["status"]) {
    setError(null);
    startTransition(async () => {
      const r = await setRestaurantStatus(id, status);
      if (r.error) setError(r.error);
    });
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-neutral-200">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Restaurant</th>
              <th className="px-4 py-2.5 font-medium">Owner</th>
              <th className="px-4 py-2.5 text-right font-medium">Commission</th>
              <th className="px-4 py-2.5 text-right font-medium">Delivery fee</th>
              <th className="px-4 py-2.5 text-right font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100 align-middle">
                <td className="px-4 py-2.5">
                  <span className="font-semibold text-neutral-900">{r.name}</span>
                  <span className="ml-2 text-xs text-neutral-400">
                    {r.is_open ? "· open" : "· closed"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-neutral-600">
                  {r.users?.full_name ?? r.users?.email ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {Number(r.commission_rate)}%
                </td>
                <td className="px-4 py-2.5 text-right">
                  {formatPrice(r.delivery_fee)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setError(null);
                        setEditing(r);
                      }}
                      className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                    >
                      Edit
                    </button>
                    {r.status !== "active" && (
                      <button
                        onClick={() => changeStatus(r.id, "active")}
                        disabled={pending}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {r.status === "pending" ? "Approve" : "Reactivate"}
                      </button>
                    )}
                    {r.status === "active" && (
                      <button
                        onClick={() => changeStatus(r.id, "suspended")}
                        disabled={pending}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditRestaurantModal
          restaurant={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

const field =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const label = "text-xs font-semibold text-stone-600";

function EditRestaurantModal({
  restaurant: r,
  onClose,
}: {
  restaurant: AdminRestaurant;
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(r.name);
  const [description, setDescription] = useState(r.description ?? "");
  const [cuisines, setCuisines] = useState(r.cuisine_types.join(", "));
  const [phone, setPhone] = useState(r.phone ?? "");
  const [address, setAddress] = useState(r.address_text ?? "");
  const [lat, setLat] = useState(r.lat != null ? String(r.lat) : "");
  const [lng, setLng] = useState(r.lng != null ? String(r.lng) : "");
  const [commission, setCommission] = useState(String(r.commission_rate));
  const [deliveryFee, setDeliveryFee] = useState(String(r.delivery_fee));
  const [minOrder, setMinOrder] = useState(String(r.min_order));
  const [prep, setPrep] = useState(String(r.default_prep_minutes));

  function save() {
    setError(null);
    start(async () => {
      const result = await updateRestaurantDetails(r.id, {
        name,
        description,
        cuisine_types: cuisines,
        phone,
        address_text: address,
        lat: lat.trim() ? Number(lat) : null,
        lng: lng.trim() ? Number(lng) : null,
        commission_rate: Number(commission),
        delivery_fee: Number(deliveryFee),
        min_order: Number(minOrder),
        default_prep_minutes: Number(prep),
      });
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <div
      className="s-fade fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-stone-950/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="s-scale-in my-6 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-stone-900">
              Edit restaurant
            </h2>
            <p className="text-xs text-stone-500">
              Owner: {r.users?.full_name ?? r.users?.email ?? "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-lg text-stone-500 hover:bg-stone-200"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={label}>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>Address</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className={label}>Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className={label}>Cuisine types (comma separated)</span>
            <input value={cuisines} onChange={(e) => setCuisines(e.target.value)} className={field} />
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>Description</span>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className={label}>Latitude</span>
            <input value={lat} onChange={(e) => setLat(e.target.value)} type="number" step="any" className={field} />
          </label>
          <label className="block">
            <span className={label}>Longitude</span>
            <input value={lng} onChange={(e) => setLng(e.target.value)} type="number" step="any" className={field} />
          </label>
          <label className="block">
            <span className={label}>Commission %</span>
            <input value={commission} onChange={(e) => setCommission(e.target.value)} type="number" min="0" max="50" className={field} />
          </label>
          <label className="block">
            <span className={label}>Delivery fee (Rs)</span>
            <input value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} type="number" min="0" className={field} />
          </label>
          <label className="block">
            <span className={label}>Min order (Rs)</span>
            <input value={minOrder} onChange={(e) => setMinOrder(e.target.value)} type="number" min="0" className={field} />
          </label>
          <label className="block">
            <span className={label}>Prep time (min)</span>
            <input value={prep} onChange={(e) => setPrep(e.target.value)} type="number" min="0" className={field} />
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={save}
            disabled={pending || !name.trim()}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm text-stone-500 hover:text-stone-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVendor } from "@/app/actions/onboarding";

function randomPassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `Sufra${s}`;
}

const input =
  "w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const labelText = "text-xs font-semibold text-stone-600";

export function AddVendorForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [description, setDescription] = useState("");
  const [cuisines, setCuisines] = useState("");
  const [commission, setCommission] = useState("15");
  const [deliveryFee, setDeliveryFee] = useState("99");
  const [minOrder, setMinOrder] = useState("300");

  function reset() {
    setFullName("");
    setEmail("");
    setPassword("");
    setRestaurantName("");
    setDescription("");
    setCuisines("");
    setCommission("15");
    setDeliveryFee("99");
    setMinOrder("300");
  }

  function submit() {
    setError(null);
    setSuccess(null);
    start(async () => {
      const r = await createVendor({
        full_name: fullName,
        email,
        password,
        restaurant_name: restaurantName,
        description,
        cuisine_types: cuisines,
        commission_rate: Number(commission),
        delivery_fee: Number(deliveryFee),
        min_order: Number(minOrder),
      });
      if (r.error) {
        setError(r.error);
        return;
      }
      setSuccess(
        `Vendor created. ${email.trim().toLowerCase()} can now sign in at the vendor portal with the password you set.`
      );
      reset();
      router.refresh();
    });
  }

  if (!open) {
    return (
      <div className="mb-5">
        {success && (
          <p className="mb-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            ✓ {success}
          </p>
        )}
        <button
          onClick={() => {
            setOpen(true);
            setSuccess(null);
          }}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-stone-800 active:scale-95"
        >
          + Add vendor
        </button>
      </div>
    );
  }

  return (
    <div className="s-scale-in mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-stone-900">New vendor</h2>
        <button
          onClick={() => setOpen(false)}
          className="text-sm font-medium text-stone-400 hover:text-stone-700"
        >
          Cancel
        </button>
      </div>

      <p className="mt-1 text-xs text-stone-500">
        Creates their login and their restaurant (active, closed until they open
        it). Share the email &amp; password with the owner.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelText}>Owner name</span>
          <input
            className={`mt-1 ${input}`}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Bilal Ahmed"
          />
        </label>
        <label className="block">
          <span className={labelText}>Restaurant name</span>
          <input
            className={`mt-1 ${input}`}
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            placeholder="e.g. Bilal Tikka House"
          />
        </label>
        <label className="block">
          <span className={labelText}>Login email</span>
          <input
            type="email"
            className={`mt-1 ${input}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@example.com"
          />
        </label>
        <label className="block">
          <span className={labelText}>Temporary password</span>
          <div className="mt-1 flex gap-2">
            <input
              className={input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min 6 characters"
            />
            <button
              type="button"
              onClick={() => setPassword(randomPassword())}
              className="whitespace-nowrap rounded-xl border border-stone-300 px-3 text-xs font-semibold text-stone-600 hover:bg-stone-100"
            >
              Generate
            </button>
          </div>
        </label>
        <label className="block sm:col-span-2">
          <span className={labelText}>Cuisine types (comma separated)</span>
          <input
            className={`mt-1 ${input}`}
            value={cuisines}
            onChange={(e) => setCuisines(e.target.value)}
            placeholder="Biryani, Desi, BBQ"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={labelText}>Description (optional)</span>
          <input
            className={`mt-1 ${input}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short tagline shown to customers"
          />
        </label>
        <label className="block">
          <span className={labelText}>Commission %</span>
          <input
            type="number"
            min="0"
            max="50"
            className={`mt-1 ${input}`}
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={labelText}>Delivery fee (Rs)</span>
          <input
            type="number"
            min="0"
            className={`mt-1 ${input}`}
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={labelText}>Min order (Rs)</span>
          <input
            type="number"
            min="0"
            className={`mt-1 ${input}`}
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={submit}
          disabled={pending || !email || !password || !fullName || !restaurantName}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create vendor"}
        </button>
      </div>
    </div>
  );
}

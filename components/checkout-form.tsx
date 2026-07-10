"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, lineTotal } from "@/lib/cart/cart-context";
import { formatPrice } from "@/types";
import {
  createAddress,
  placeOrder,
  previewVoucher,
} from "@/app/actions/orders";

export interface Address {
  id: string;
  label: string | null;
  address_text: string | null;
  landmark: string | null;
  city: string | null;
  is_default: boolean;
}

export function CheckoutForm({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const { cart, subtotal, clearCart } = useCart();

  const [addressList, setAddressList] = useState(addresses);
  const [selectedId, setSelectedId] = useState<string | null>(
    addresses[0]?.id ?? null
  );
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New-address form state
  const [label, setLabel] = useState("Home");
  const [addressText, setAddressText] = useState("");
  const [landmark, setLandmark] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Voucher state
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated) return null;

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="mt-8 text-center">
        <p className="text-neutral-500">Your cart is empty.</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white"
        >
          Browse restaurants
        </Link>
      </div>
    );
  }

  const discount = voucher?.discount ?? 0;
  const total = Math.max(subtotal - discount, 0) + cart.delivery_fee;

  async function applyVoucher() {
    if (!cart) return;
    setVoucherError(null);
    setApplying(true);
    const result = await previewVoucher(
      voucherInput,
      subtotal,
      cart.restaurant_id
    );
    setApplying(false);
    if (result.error || result.discount == null) {
      setVoucher(null);
      setVoucherError(result.error ?? "Could not apply voucher");
      return;
    }
    setVoucher({ code: voucherInput.trim(), discount: result.discount });
  }

  function captureLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function saveAddress() {
    setError(null);
    setSaving(true);
    const result = await createAddress({
      label,
      address_text: addressText,
      landmark,
      city: "Karachi",
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    });
    setSaving(false);
    if (result.error || !result.addressId) {
      setError(result.error ?? "Could not save address");
      return;
    }
    setAddressList((prev) => [
      ...prev,
      {
        id: result.addressId!,
        label,
        address_text: addressText,
        landmark,
        city: "Karachi",
        is_default: false,
      },
    ]);
    setSelectedId(result.addressId);
    setShowForm(false);
    setAddressText("");
    setLandmark("");
    setCoords(null);
  }

  async function submitOrder() {
    if (!selectedId || !cart) return;
    setError(null);
    setPlacing(true);

    const result = await placeOrder({
      restaurant_id: cart.restaurant_id,
      address_id: selectedId,
      voucher_code: voucher?.code,
      items: cart.lines.map((l) => ({
        menu_item_id: l.menu_item_id,
        quantity: l.quantity,
        modifier_ids: l.modifiers.map((m) => m.id),
        special_instructions: l.special_instructions,
      })),
    });

    if (result.error || !result.orderId) {
      setPlacing(false);
      setError(result.error ?? "Could not place order");
      return;
    }
    clearCart();
    router.replace(`/orders/${result.orderId}`);
  }

  return (
    <div className="mt-5 space-y-5">
      {/* Delivery address */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <h2 className="font-semibold text-neutral-900">Delivery address</h2>

        {addressList.length > 0 && (
          <div className="mt-3 space-y-2">
            {addressList.map((a) => (
              <label
                key={a.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedId === a.id}
                  onChange={() => setSelectedId(a.id)}
                  className="mt-0.5 accent-emerald-600"
                />
                <span>
                  <span className="font-semibold">{a.label ?? "Address"}</span>
                  <span className="block text-neutral-600">{a.address_text}</span>
                  {a.landmark && (
                    <span className="block text-neutral-400">
                      Near {a.landmark}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}

        {showForm ? (
          <div className="mt-4 space-y-3 rounded-lg bg-neutral-50 p-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="font-medium text-neutral-700">Label</span>
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2"
                >
                  <option>Home</option>
                  <option>Work</option>
                  <option>Other</option>
                </select>
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={captureLocation}
                  className="w-full rounded-lg border border-emerald-600 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  {locating
                    ? "Locating…"
                    : coords
                      ? "✓ Location pinned"
                      : "📍 Use my location"}
                </button>
              </div>
            </div>
            <label className="block text-sm">
              <span className="font-medium text-neutral-700">
                Complete address
              </span>
              <input
                type="text"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                placeholder="House #, street, area"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-neutral-700">
                Nearest landmark
              </span>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. opposite Imtiaz Store"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveAddress}
                disabled={saving || !addressText.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save address"}
              </button>
              {addressList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-4 py-2 text-sm text-neutral-500 hover:text-neutral-800"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-3 text-sm font-medium text-emerald-700 hover:underline"
          >
            + Add new address
          </button>
        )}
      </section>

      {/* Payment */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <h2 className="font-semibold text-neutral-900">Payment method</h2>
        <label className="mt-3 flex items-center gap-3 rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-2.5 text-sm">
          <input type="radio" checked readOnly className="accent-emerald-600" />
          <span>
            <span className="font-semibold">Cash on Delivery</span>
            <span className="block text-neutral-500">
              Pay the rider when your food arrives
            </span>
          </span>
        </label>
        <p className="mt-2 text-xs text-neutral-400">
          JazzCash &amp; Easypaisa coming soon.
        </p>
      </section>

      {/* Voucher */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <h2 className="font-semibold text-neutral-900">Voucher</h2>
        {voucher ? (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5 text-sm">
            <span className="font-semibold text-emerald-800">
              {voucher.code.toUpperCase()} applied — you save{" "}
              {formatPrice(voucher.discount)}
            </span>
            <button
              type="button"
              onClick={() => {
                setVoucher(null);
                setVoucherInput("");
              }}
              className="text-emerald-700 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={voucherInput}
              onChange={(e) => {
                setVoucherInput(e.target.value);
                setVoucherError(null);
              }}
              placeholder="Enter voucher code"
              className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm uppercase"
            />
            <button
              type="button"
              onClick={applyVoucher}
              disabled={applying || !voucherInput.trim()}
              className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            >
              {applying ? "Checking…" : "Apply"}
            </button>
          </div>
        )}
        {voucherError && (
          <p className="mt-2 text-sm text-red-600">{voucherError}</p>
        )}
      </section>

      {/* Summary */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <h2 className="font-semibold text-neutral-900">
          Order summary · {cart.restaurant_name}
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm text-neutral-600">
          {cart.lines.map((l) => (
            <li key={l.key} className="flex justify-between">
              <span>
                {l.quantity}× {l.name}
                {l.modifiers.length > 0 && (
                  <span className="text-neutral-400">
                    {" "}
                    ({l.modifiers.map((m) => m.name).join(", ")})
                  </span>
                )}
              </span>
              <span>{formatPrice(lineTotal(l))}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-neutral-200 pt-3 text-sm">
          <div className="flex justify-between text-neutral-600">
            <dt>Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Voucher discount</dt>
              <dd>−{formatPrice(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-neutral-600">
            <dt>Delivery fee</dt>
            <dd>{formatPrice(cart.delivery_fee)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold text-neutral-900">
            <dt>Total (COD)</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        onClick={submitOrder}
        disabled={placing || !selectedId}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {placing ? "Placing order…" : `Place order · ${formatPrice(total)}`}
      </button>
    </div>
  );
}

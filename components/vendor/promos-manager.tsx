"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createVendorVoucher,
  setVendorVoucherActive,
} from "@/app/actions/promos";
import type { VendorVoucher } from "@/lib/db/vendor";
import { formatPrice } from "@/types";

const input =
  "w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const labelText = "text-xs font-semibold text-stone-600";

export function PromosManager({
  restaurantId,
  vouchers,
}: {
  restaurantId: string;
  vouchers: VendorVoucher[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [validTo, setValidTo] = useState("");
  const [usageLimit, setUsageLimit] = useState("");

  function create() {
    setError(null);
    start(async () => {
      const r = await createVendorVoucher(restaurantId, {
        code,
        discount_type: type,
        value: Number(value),
        min_order: Number(minOrder) || 0,
        max_discount: maxDiscount ? Number(maxDiscount) : null,
        valid_to: validTo ? new Date(validTo + "T23:59:59+05:00").toISOString() : null,
        usage_limit: usageLimit ? Number(usageLimit) : null,
      });
      if (r.error) setError(r.error);
      else {
        setCode("");
        setValue("");
        setMinOrder("");
        setMaxDiscount("");
        setValidTo("");
        setUsageLimit("");
        router.refresh();
      }
    });
  }

  function toggle(v: VendorVoucher) {
    setError(null);
    start(async () => {
      const r = await setVendorVoucherActive(v.id, !v.is_active);
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 p-5">
        <h2 className="text-sm font-semibold text-stone-800">
          Create a promo code
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
          <label className="block">
            <span className={labelText}>Code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EID20"
              className={`mt-1 ${input} uppercase`}
            />
          </label>
          <label className="block">
            <span className={labelText}>Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "percent" | "fixed")}
              className={`mt-1 ${input} bg-white`}
            >
              <option value="percent">% off</option>
              <option value="fixed">Rs off</option>
            </select>
          </label>
          <label className="block">
            <span className={labelText}>
              {type === "percent" ? "Percent" : "Amount (Rs)"}
            </span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              type="number"
              min="1"
              placeholder={type === "percent" ? "20" : "100"}
              className={`mt-1 ${input}`}
            />
          </label>
          <label className="block">
            <span className={labelText}>Min order</span>
            <input
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              type="number"
              min="0"
              placeholder="0"
              className={`mt-1 ${input}`}
            />
          </label>
          <label className="block">
            <span className={labelText}>Max discount</span>
            <input
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              type="number"
              min="0"
              placeholder="cap (Rs)"
              className={`mt-1 ${input}`}
            />
          </label>
          <label className="block">
            <span className={labelText}>Expires</span>
            <input
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
              type="date"
              className={`mt-1 ${input}`}
            />
          </label>
          <label className="block">
            <span className={labelText}>Total uses</span>
            <input
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              type="number"
              min="1"
              placeholder="unlimited"
              className={`mt-1 ${input}`}
            />
          </label>
        </div>
        <button
          onClick={create}
          disabled={pending || !code.trim() || !value}
          className="mt-3 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create code"}
        </button>
      </section>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-stone-200">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Code</th>
              <th className="px-4 py-2.5 font-medium">Discount</th>
              <th className="px-4 py-2.5 text-right font-medium">Min order</th>
              <th className="px-4 py-2.5 text-right font-medium">Used</th>
              <th className="px-4 py-2.5 font-medium">Expires</th>
              <th className="px-4 py-2.5 text-right font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id} className="border-t border-stone-100">
                <td className="px-4 py-2.5 font-mono font-semibold">{v.code}</td>
                <td className="px-4 py-2.5">
                  {v.discount_type === "percent"
                    ? `${Number(v.value)}% off`
                    : `${formatPrice(v.value)} off`}
                  {v.max_discount != null &&
                    ` (max ${formatPrice(v.max_discount)})`}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {formatPrice(v.min_order)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {v.times_used}
                  {v.usage_limit != null && ` / ${v.usage_limit}`}
                </td>
                <td className="px-4 py-2.5 text-stone-500">
                  {v.valid_to
                    ? new Date(v.valid_to).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "Never"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      v.is_active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-200 text-stone-600"
                    }`}
                  >
                    {v.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => toggle(v)}
                    disabled={pending}
                    className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
                  >
                    {v.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-stone-400">
                  No promo codes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { createVoucher, setVoucherActive } from "@/app/actions/vouchers";
import { formatPrice } from "@/types";

export interface VoucherRow {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  value: number;
  min_order: number;
  max_discount: number | null;
  valid_to: string | null;
  usage_limit: number | null;
  times_used: number;
  is_active: boolean;
}

export function VouchersManager({ vouchers }: { vouchers: VoucherRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // New voucher form
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [validTo, setValidTo] = useState("");
  const [usageLimit, setUsageLimit] = useState("");

  function add() {
    setError(null);
    startTransition(async () => {
      const r = await createVoucher({
        code,
        discount_type: type,
        value: Number(value),
        min_order: Number(minOrder) || 0,
        max_discount: maxDiscount ? Number(maxDiscount) : null,
        valid_to: validTo ? new Date(validTo + "T23:59:59").toISOString() : null,
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
      }
    });
  }

  function toggle(v: VoucherRow) {
    setError(null);
    startTransition(async () => {
      const r = await setVoucherActive(v.id, !v.is_active);
      if (r.error) setError(r.error);
    });
  }

  const inputClass =
    "rounded-lg border border-neutral-300 px-3 py-2 text-sm";

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4">
        <h2 className="text-sm font-semibold text-neutral-800">
          Create voucher
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CODE"
            className={`${inputClass} uppercase`}
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "percent" | "fixed")}
            className={`${inputClass} bg-white`}
          >
            <option value="percent">% off</option>
            <option value="fixed">Rs off</option>
          </select>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="number"
            min="1"
            placeholder={type === "percent" ? "e.g. 20 (%)" : "e.g. 100 (Rs)"}
            className={inputClass}
          />
          <input
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            type="number"
            min="0"
            placeholder="Min order"
            className={inputClass}
          />
          <input
            value={maxDiscount}
            onChange={(e) => setMaxDiscount(e.target.value)}
            type="number"
            min="0"
            placeholder="Max disc."
            className={inputClass}
          />
          <input
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
            type="date"
            className={inputClass}
          />
          <input
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            type="number"
            min="1"
            placeholder="Use limit"
            className={inputClass}
          />
        </div>
        <button
          onClick={add}
          disabled={pending || !code.trim() || !value}
          className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create voucher"}
        </button>
      </section>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-neutral-200">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
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
              <tr key={v.id} className="border-t border-neutral-100">
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
                <td className="px-4 py-2.5 text-neutral-500">
                  {v.valid_to
                    ? new Date(v.valid_to).toLocaleDateString("en-PK", {
                        dateStyle: "medium",
                      })
                    : "Never"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      v.is_active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {v.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => toggle(v)}
                    disabled={pending}
                    className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    {v.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-400">
                  No vouchers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

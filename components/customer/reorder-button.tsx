"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/cart-context";
import { getReorderCart } from "@/app/actions/orders";

export function ReorderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { addLine } = useCart();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function reorder() {
    setErr(null);
    start(async () => {
      const r = await getReorderCart(orderId);
      if (r.error || !r.restaurant || !r.lines) {
        setErr(r.error ?? "Couldn't reorder");
        return;
      }
      // First line replaces any existing cart; the rest append.
      r.lines.forEach((line, i) =>
        addLine(r.restaurant!, line, i === 0 ? { replace: true } : undefined)
      );
      router.push("/cart");
    });
  }

  return (
    <div>
      <button
        onClick={reorder}
        disabled={pending}
        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
      >
        {pending ? "Adding to cart…" : "🔁 Order again"}
      </button>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </div>
  );
}

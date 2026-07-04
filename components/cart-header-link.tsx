"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";

export function CartHeaderLink() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
    >
      Cart
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-xs font-bold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}

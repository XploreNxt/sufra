"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";

export function CartHeaderLink() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative rounded-full border border-stone-300 bg-white/70 px-4 py-2 text-sm font-semibold text-stone-700 transition-all hover:border-stone-400 hover:shadow-sm active:scale-95"
    >
      Cart
      {itemCount > 0 && (
        <span className="s-scale-in absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 px-1 text-xs font-extrabold text-amber-950 shadow-md">
          {itemCount}
        </span>
      )}
    </Link>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, lineTotal } from "@/lib/cart/cart-context";
import { formatPrice } from "@/types";

export default function CartPage() {
  const router = useRouter();
  const { cart, subtotal, setQuantity, removeLine, clearCart } = useCart();

  if (!cart || cart.lines.length === 0) {
    return (
      <main className="py-16 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Your cart is empty</h1>
        <p className="mt-2 text-neutral-500">
          Find something delicious to get started.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
        >
          Browse restaurants
        </Link>
      </main>
    );
  }

  const belowMin = subtotal < cart.min_order;

  return (
    <main className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Your cart</h1>
        <button
          onClick={clearCart}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Clear cart
        </button>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        From{" "}
        <Link
          href={`/restaurant/${cart.restaurant_id}`}
          className="font-medium text-emerald-700 hover:underline"
        >
          {cart.restaurant_name}
        </Link>
      </p>

      <div className="mt-5 space-y-3">
        {cart.lines.map((line) => (
          <div
            key={line.key}
            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-neutral-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-neutral-900">{line.name}</h3>
                {line.modifiers.length > 0 && (
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {line.modifiers.map((m) => m.name).join(", ")}
                  </p>
                )}
                {line.special_instructions && (
                  <p className="mt-0.5 text-sm italic text-neutral-400">
                    “{line.special_instructions}”
                  </p>
                )}
              </div>
              <span className="whitespace-nowrap font-semibold text-neutral-900">
                {formatPrice(lineTotal(line))}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center rounded-lg border border-neutral-300">
                <button
                  onClick={() => setQuantity(line.key, line.quantity - 1)}
                  className="px-3 py-1.5 text-lg leading-none text-neutral-600"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold">
                  {line.quantity}
                </span>
                <button
                  onClick={() => setQuantity(line.key, Math.min(50, line.quantity + 1))}
                  className="px-3 py-1.5 text-lg leading-none text-neutral-600"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeLine(line.key)}
                className="text-sm text-neutral-400 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between text-neutral-600">
            <dt>Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-neutral-500">
            <dt>Delivery fee</dt>
            <dd>Calculated at checkout</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold text-neutral-900">
            <dt>Total</dt>
            <dd>
              {formatPrice(subtotal)}
              <span className="text-xs font-normal text-neutral-400"> + delivery</span>
            </dd>
          </div>
        </dl>

        {belowMin && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Minimum order is {formatPrice(cart.min_order)} — add{" "}
            {formatPrice(cart.min_order - subtotal)} more.
          </p>
        )}

        <button
          onClick={() => router.push("/checkout")}
          disabled={belowMin}
          className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          Proceed to checkout
        </button>
      </div>
    </main>
  );
}

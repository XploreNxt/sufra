"use client";

import { useState } from "react";
import Link from "next/link";
import type { Bundle, MenuItem, RestaurantWithMenu } from "@/types";
import { formatPrice } from "@/types";
import { useCart, type CartLine, type CartModifier } from "@/lib/cart/cart-context";

export function RestaurantMenu({
  restaurant,
  bundles = [],
}: {
  restaurant: RestaurantWithMenu;
  bundles?: Bundle[];
}) {
  const { cart, itemCount, subtotal, addLine } = useCart();
  const [picking, setPicking] = useState<MenuItem | null>(null);

  const cartInfo = {
    id: restaurant.id,
    name: restaurant.name,
    delivery_fee: Number(restaurant.delivery_fee),
    min_order: Number(restaurant.min_order),
  };

  function addToCart(line: Omit<CartLine, "key">) {
    const ok = addLine(cartInfo, line);
    if (!ok) {
      const replace = window.confirm(
        `Your cart has items from ${cart?.restaurant_name}. Start a new cart with ${restaurant.name}?`
      );
      if (replace) addLine(cartInfo, line, { replace: true });
    }
  }

  function add(item: MenuItem, modifiers: CartModifier[], quantity: number, note?: string) {
    addToCart({
      menu_item_id: item.id,
      name: item.name,
      unit_price: Number(item.price),
      quantity,
      modifiers,
      special_instructions: note,
    });
  }

  function addBundle(bundle: Bundle) {
    addToCart({
      kind: "bundle",
      bundle_id: bundle.id,
      menu_item_id: "",
      name: bundle.name,
      unit_price: Number(bundle.price),
      quantity: 1,
      modifiers: bundle.bundle_items.map((bi) => ({
        id: bi.id,
        name: `${bi.quantity}× ${bi.menu_items?.name ?? "item"}`,
        price_delta: 0,
      })),
    });
  }

  return (
    <>
      {bundles.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-stone-900">
            🎁 Offers &amp; bundles
            <span className="h-px flex-1 bg-gradient-to-r from-amber-200 to-transparent" />
          </h2>
          <div className="s-stagger mt-4 grid gap-3 sm:grid-cols-2">
            {bundles.map((b) => (
              <div
                key={b.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-amber-200"
              >
                {b.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.image_url}
                    alt={b.name}
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 text-5xl">
                    🎁
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-stone-900">{b.name}</h3>
                    <span className="whitespace-nowrap font-extrabold text-stone-900">
                      {formatPrice(b.price)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-stone-500">
                    {b.bundle_items
                      .map((bi) => `${bi.quantity}× ${bi.menu_items?.name ?? "item"}`)
                      .join(" · ")}
                  </p>
                  {b.description && (
                    <p className="mt-1 text-sm text-stone-500">{b.description}</p>
                  )}
                  {restaurant.is_open && (
                    <button
                      onClick={() => addBundle(b)}
                      className="mt-3 w-full rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-amber-950 shadow-sm transition-all hover:bg-amber-400 active:scale-95"
                    >
                      + Add deal
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {restaurant.menu_categories.map((cat) => (
        <section key={cat.id} className="mt-10">
          <h2 className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-stone-900">
            {cat.name}
            <span className="h-px flex-1 bg-gradient-to-r from-stone-200 to-transparent" />
          </h2>
          <div className="s-stagger mt-4 space-y-3">
            {cat.menu_items.map((item) => (
              <div
                key={item.id}
                className={`group flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/80 transition-all duration-300 hover:shadow-md hover:ring-emerald-200 ${
                  item.is_available ? "" : "opacity-60 saturate-50"
                }`}
              >
                {item.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-stone-200 sm:h-24 sm:w-24"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-stone-900">
                    {item.name}
                    {!item.is_available && (
                      <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
                        Unavailable
                      </span>
                    )}
                  </h3>
                  {item.description && (
                    <p className="mt-1 text-sm leading-relaxed text-stone-500">
                      {item.description}
                    </p>
                  )}
                  {item.modifier_groups.length > 0 && (
                    <p className="mt-1.5 text-xs font-bold text-emerald-700">
                      ✨ Customizable ·{" "}
                      {item.modifier_groups.map((g) => g.name).join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2.5">
                  <span className="whitespace-nowrap font-extrabold text-stone-900">
                    {formatPrice(item.price)}
                  </span>
                  {item.is_available && restaurant.is_open && (
                    <button
                      onClick={() =>
                        item.modifier_groups.length > 0
                          ? setPicking(item)
                          : add(item, [], 1)
                      }
                      className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-600/30 active:scale-90"
                    >
                      + Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {!restaurant.is_open && (
        <p className="s-fade-up mt-10 rounded-2xl bg-stone-100 px-5 py-4 text-center text-sm font-medium text-stone-600">
          😴 This kitchen is resting — browse now, order when it reopens.
        </p>
      )}

      {picking && (
        <ItemOptionsModal
          item={picking}
          onClose={() => setPicking(null)}
          onAdd={(mods, qty, note) => {
            add(picking, mods, qty, note);
            setPicking(null);
          }}
        />
      )}

      {cart && cart.restaurant_id === restaurant.id && itemCount > 0 && (
        <Link
          href="/cart"
          className="s-slide-up fixed bottom-5 left-1/2 z-20 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-6 py-4 font-bold text-white shadow-2xl shadow-emerald-900/40 ring-1 ring-white/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm font-extrabold">
              {itemCount}
            </span>
            View cart
          </span>
          <span className="text-lg">{formatPrice(subtotal)}</span>
        </Link>
      )}
    </>
  );
}

function ItemOptionsModal({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItem;
  onClose: () => void;
  onAdd: (modifiers: CartModifier[], quantity: number, note?: string) => void;
}) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function toggle(groupId: string, modId: string, max: number, single: boolean) {
    setError(null);
    setSelected((prev) => {
      const cur = prev[groupId] ?? [];
      if (single) return { ...prev, [groupId]: [modId] };
      if (cur.includes(modId))
        return { ...prev, [groupId]: cur.filter((m) => m !== modId) };
      if (cur.length >= max) return prev;
      return { ...prev, [groupId]: [...cur, modId] };
    });
  }

  function confirm() {
    for (const g of item.modifier_groups) {
      const count = (selected[g.id] ?? []).length;
      if (g.is_required && count < Math.max(g.min_select, 1)) {
        setError(`Please choose ${g.name}`);
        return;
      }
    }
    const mods: CartModifier[] = item.modifier_groups.flatMap((g) =>
      (selected[g.id] ?? []).map((id) => {
        const m = g.modifiers.find((x) => x.id === id)!;
        return { id: m.id, name: m.name, price_delta: Number(m.price_delta) };
      })
    );
    onAdd(mods, quantity, note.trim() || undefined);
  }

  const modsTotal = item.modifier_groups.flatMap((g) =>
    (selected[g.id] ?? []).map(
      (id) => Number(g.modifiers.find((x) => x.id === id)?.price_delta ?? 0)
    )
  );
  const total =
    (Number(item.price) + modsTotal.reduce((s, d) => s + d, 0)) * quantity;

  return (
    <div
      className="s-fade fixed inset-0 z-30 flex items-end justify-center bg-stone-950/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="s-scale-in max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-stone-900">
              {item.name}
            </h3>
            <p className="mt-0.5 text-sm font-semibold text-stone-500">
              {formatPrice(item.price)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-lg text-stone-500 transition-all hover:bg-stone-200 hover:text-stone-800 active:scale-90"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {item.modifier_groups.map((g) => {
          const single = g.max_select <= 1;
          return (
            <fieldset key={g.id} className="mt-5">
              <legend className="text-sm font-bold text-stone-800">
                {g.name}{" "}
                <span className="font-medium text-stone-400">
                  {g.is_required ? "(required)" : `(up to ${g.max_select})`}
                </span>
              </legend>
              <div className="mt-2 space-y-2">
                {g.modifiers.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium transition-all has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:shadow-sm hover:border-stone-300"
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type={single ? "radio" : "checkbox"}
                        name={g.id}
                        checked={(selected[g.id] ?? []).includes(m.id)}
                        onChange={() => toggle(g.id, m.id, g.max_select, single)}
                        className="accent-emerald-600"
                      />
                      {m.name}
                    </span>
                    {Number(m.price_delta) > 0 && (
                      <span className="font-semibold text-stone-500">
                        +{formatPrice(m.price_delta)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}

        <label className="mt-5 block">
          <span className="text-sm font-bold text-stone-800">
            Special instructions{" "}
            <span className="font-medium text-stone-400">(optional)</span>
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. less spicy"
            maxLength={200}
            className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-stone-300">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3.5 py-2.5 text-lg leading-none text-stone-600 transition-colors hover:text-emerald-700"
            >
              −
            </button>
            <span className="w-8 text-center font-extrabold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(50, q + 1))}
              className="px-3.5 py-2.5 text-lg leading-none text-stone-600 transition-colors hover:text-emerald-700"
            >
              +
            </button>
          </div>
          <button
            onClick={confirm}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 hover:shadow-lg active:scale-95"
          >
            Add · {formatPrice(total)}
          </button>
        </div>
        {error && (
          <p className="s-fade-up mt-3 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

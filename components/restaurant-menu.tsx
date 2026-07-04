"use client";

import { useState } from "react";
import Link from "next/link";
import type { MenuItem, RestaurantWithMenu } from "@/types";
import { formatPrice } from "@/types";
import { useCart, type CartModifier } from "@/lib/cart/cart-context";

export function RestaurantMenu({
  restaurant,
}: {
  restaurant: RestaurantWithMenu;
}) {
  const { cart, itemCount, subtotal, addLine } = useCart();
  const [picking, setPicking] = useState<MenuItem | null>(null);

  const cartInfo = {
    id: restaurant.id,
    name: restaurant.name,
    delivery_fee: Number(restaurant.delivery_fee),
    min_order: Number(restaurant.min_order),
  };

  function add(item: MenuItem, modifiers: CartModifier[], quantity: number, note?: string) {
    const line = {
      menu_item_id: item.id,
      name: item.name,
      unit_price: Number(item.price),
      quantity,
      modifiers,
      special_instructions: note,
    };
    const ok = addLine(cartInfo, line);
    if (!ok) {
      const replace = window.confirm(
        `Your cart has items from ${cart?.restaurant_name}. Start a new cart with ${restaurant.name}?`
      );
      if (replace) addLine(cartInfo, line, { replace: true });
    }
  }

  return (
    <>
      {restaurant.menu_categories.map((cat) => (
        <section key={cat.id} className="mt-8">
          <h2 className="text-lg font-bold text-neutral-900">{cat.name}</h2>
          <div className="mt-3 space-y-3">
            {cat.menu_items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 ${
                  item.is_available ? "" : "opacity-60"
                }`}
              >
                <div>
                  <h3 className="font-semibold text-neutral-900">
                    {item.name}
                    {!item.is_available && (
                      <span className="ml-2 text-xs font-medium text-red-600">
                        Unavailable
                      </span>
                    )}
                  </h3>
                  {item.description && (
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {item.description}
                    </p>
                  )}
                  {item.modifier_groups.length > 0 && (
                    <p className="mt-1 text-xs font-medium text-emerald-700">
                      Customizable ·{" "}
                      {item.modifier_groups.map((g) => g.name).join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="whitespace-nowrap font-semibold text-neutral-900">
                    {formatPrice(item.price)}
                  </span>
                  {item.is_available && restaurant.is_open && (
                    <button
                      onClick={() =>
                        item.modifier_groups.length > 0
                          ? setPicking(item)
                          : add(item, [], 1)
                      }
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-emerald-700"
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
        <p className="mt-10 rounded-xl bg-neutral-100 px-4 py-3 text-center text-sm text-neutral-600">
          This restaurant is currently closed — you can browse the menu but not
          order.
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
          className="fixed bottom-4 left-1/2 z-20 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-2xl bg-emerald-600 px-5 py-3.5 font-semibold text-white shadow-lg transition hover:bg-emerald-700"
        >
          <span>
            View cart · {itemCount} item{itemCount > 1 ? "s" : ""}
          </span>
          <span>{formatPrice(subtotal)}</span>
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
      if (cur.length >= max) return prev; // at max — ignore extra picks
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
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">{item.name}</h3>
            <p className="text-sm text-neutral-500">{formatPrice(item.price)}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-2 text-xl text-neutral-400 hover:text-neutral-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {item.modifier_groups.map((g) => {
          const single = g.max_select <= 1;
          return (
            <fieldset key={g.id} className="mt-4">
              <legend className="text-sm font-semibold text-neutral-800">
                {g.name}{" "}
                <span className="font-normal text-neutral-400">
                  {g.is_required ? "(required)" : `(up to ${g.max_select})`}
                </span>
              </legend>
              <div className="mt-2 space-y-1.5">
                {g.modifiers.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"
                  >
                    <span className="flex items-center gap-2">
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
                      <span className="text-neutral-500">
                        +{formatPrice(m.price_delta)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-neutral-800">
            Special instructions{" "}
            <span className="font-normal text-neutral-400">(optional)</span>
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. less spicy"
            maxLength={200}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
          />
        </label>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-neutral-300">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-lg leading-none text-neutral-600"
            >
              −
            </button>
            <span className="w-8 text-center font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(50, q + 1))}
              className="px-3 py-2 text-lg leading-none text-neutral-600"
            >
              +
            </button>
          </div>
          <button
            onClick={confirm}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
          >
            Add · {formatPrice(total)}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

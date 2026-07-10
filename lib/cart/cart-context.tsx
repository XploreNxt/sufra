"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface CartModifier {
  id: string;
  name: string;
  price_delta: number;
}

export interface CartLine {
  key: string; // unique per line (same item w/ different options = 2 lines)
  kind?: "item" | "bundle"; // defaults to "item"
  menu_item_id: string; // empty for bundles
  bundle_id?: string; // set for bundles
  name: string;
  unit_price: number;
  quantity: number;
  modifiers: CartModifier[]; // for bundles: the included items (price 0)
  special_instructions?: string;
}

export interface Cart {
  restaurant_id: string;
  restaurant_name: string;
  delivery_fee: number;
  min_order: number;
  lines: CartLine[];
}

interface CartContextValue {
  cart: Cart | null;
  /** Adds a line; returns false if the cart belongs to another restaurant. */
  addLine: (
    restaurant: {
      id: string;
      name: string;
      delivery_fee: number;
      min_order: number;
    },
    line: Omit<CartLine, "key">,
    opts?: { replace?: boolean }
  ) => boolean;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "food-delivery-cart";

export function lineTotal(line: CartLine): number {
  const mods = line.modifiers.reduce((s, m) => s + Number(m.price_delta), 0);
  return (Number(line.unit_price) + mods) * line.quantity;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {
      // corrupt cart — start fresh
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (cart && cart.lines.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [cart, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = cart?.lines.reduce((s, l) => s + l.quantity, 0) ?? 0;
    const subtotal = cart?.lines.reduce((s, l) => s + lineTotal(l), 0) ?? 0;

    return {
      cart,
      itemCount,
      subtotal,
      addLine(restaurant, line, opts) {
        let ok = true;
        setCart((prev) => {
          if (prev && prev.restaurant_id !== restaurant.id && !opts?.replace) {
            ok = false;
            return prev;
          }
          const base =
            prev && prev.restaurant_id === restaurant.id
              ? prev
              : {
                  restaurant_id: restaurant.id,
                  restaurant_name: restaurant.name,
                  delivery_fee: Number(restaurant.delivery_fee),
                  min_order: Number(restaurant.min_order),
                  lines: [] as CartLine[],
                };
          return {
            ...base,
            lines: [
              ...base.lines,
              { ...line, key: `${line.menu_item_id}-${Date.now()}` },
            ],
          };
        });
        return ok;
      },
      setQuantity(key, quantity) {
        setCart((prev) => {
          if (!prev) return prev;
          const lines = prev.lines
            .map((l) => (l.key === key ? { ...l, quantity } : l))
            .filter((l) => l.quantity > 0);
          return lines.length ? { ...prev, lines } : null;
        });
      },
      removeLine(key) {
        setCart((prev) => {
          if (!prev) return prev;
          const lines = prev.lines.filter((l) => l.key !== key);
          return lines.length ? { ...prev, lines } : null;
        });
      },
      clearCart() {
        setCart(null);
      },
    };
  }, [cart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

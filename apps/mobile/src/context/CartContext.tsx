import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { FoodItem } from "@/types";

export interface CartItem {
  food: FoodItem;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (food: FoodItem) => void;
  decrementItem: (foodId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((food: FoodItem) => {
    setItems((current) => {
      const existing = current.find((item) => item.food.id === food.id);
      if (existing) {
        return current.map((item) =>
          item.food.id === food.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...current, { food, quantity: 1 }];
    });
  }, []);

  const decrementItem = useCallback((foodId: string) => {
    setItems((current) =>
      current.flatMap((item) => {
        if (item.food.id !== foodId) return [item];
        if (item.quantity <= 1) return [];
        return [{ ...item, quantity: item.quantity - 1 }];
      }),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.food.price * item.quantity, 0),
      addItem,
      decrementItem,
      clearCart,
    }),
    [addItem, clearCart, decrementItem, items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }
  return context;
}

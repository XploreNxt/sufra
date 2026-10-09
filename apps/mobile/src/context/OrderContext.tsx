import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CartItem } from "@/context/CartContext";
import { mockRider, mockUser } from "@/data/mockFood";
import type { ActiveOrder } from "@/types";

interface PlaceOrderInput {
  items: CartItem[];
  total: number;
  paymentLabel: string;
}

interface OrderContextValue {
  activeOrder: ActiveOrder | null;
  placeOrder: (input: PlaceOrderInput) => void;
  clearOrder: () => void;
}

const OrderContext = createContext<OrderContextValue | null>(null);

interface OrderProviderProps {
  children: ReactNode;
}

export function OrderProvider({ children }: OrderProviderProps) {
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);

  const placeOrder = useCallback(({ items, total, paymentLabel }: PlaceOrderInput) => {
    const placedAt = Date.now();
    setActiveOrder({
      id: `SF-${String(placedAt).slice(-6)}`,
      placedAt,
      total,
      paymentLabel,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
      lines: items.map((item) => ({
        id: item.food.id,
        name: item.food.name,
        quantity: item.quantity,
      })),
      restaurantName: items[0]?.food.restaurant_name ?? "Surfa kitchen",
      address: mockUser.address,
      riderName: mockRider.name,
      riderVehicle: mockRider.vehicle,
    });
  }, []);

  const clearOrder = useCallback(() => setActiveOrder(null), []);

  const value = useMemo(
    () => ({ activeOrder, placeOrder, clearOrder }),
    [activeOrder, clearOrder, placeOrder],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder(): OrderContextValue {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider.");
  }
  return context;
}

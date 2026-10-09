import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { MOCK_MENU, MOCK_ORDERS, MOCK_SALES } from "@/data/mockVendor";
import type { VendorMenuItem, VendorOrder, VendorOrderStatus, VendorSale } from "@/types/vendor";

interface VendorContextValue {
  menu: VendorMenuItem[];
  orders: VendorOrder[];
  sales: VendorSale[];
  setAvailability: (ids: string[], isAvailable: boolean) => void;
  addItem: (item: Omit<VendorMenuItem, "id" | "isAvailable">) => void;
  updateItem: (id: string, patch: Partial<VendorMenuItem>) => void;
  deleteItem: (id: string) => void;
  advanceOrder: (id: string, to: VendorOrderStatus) => void;
}

const VendorContext = createContext<VendorContextValue | null>(null);

export function VendorProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState<VendorMenuItem[]>(MOCK_MENU);
  const [orders, setOrders] = useState<VendorOrder[]>(MOCK_ORDERS);
  const sales = MOCK_SALES;

  const setAvailability = useCallback((ids: string[], isAvailable: boolean) => {
    setMenu((prev) =>
      prev.map((m) => (ids.includes(m.id) ? { ...m, isAvailable } : m))
    );
  }, []);

  const addItem = useCallback((item: Omit<VendorMenuItem, "id" | "isAvailable">) => {
    setMenu((prev) => [
      ...prev,
      { ...item, id: `m${Date.now()}`, isAvailable: true },
    ]);
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<VendorMenuItem>) => {
    setMenu((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setMenu((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const advanceOrder = useCallback((id: string, to: VendorOrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: to } : o)));
  }, []);

  const value = useMemo(
    () => ({ menu, orders, sales, setAvailability, addItem, updateItem, deleteItem, advanceOrder }),
    [menu, orders, sales, setAvailability, addItem, updateItem, deleteItem, advanceOrder]
  );

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
}

export function useVendor() {
  const ctx = useContext(VendorContext);
  if (!ctx) throw new Error("useVendor must be used inside VendorProvider");
  return ctx;
}

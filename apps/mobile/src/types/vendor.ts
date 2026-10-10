export type VendorOrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "delivered";

export interface VendorMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  isAvailable: boolean;
}

export interface VendorOrderLine {
  name: string;
  quantity: number;
  price: number;
}

export interface VendorOrder {
  id: string;
  placedAt: string; // ISO
  status: VendorOrderStatus;
  paymentMethod: "cash" | "card";
  items: VendorOrderLine[];
  total: number;
}

export interface VendorSale {
  id: string;
  deliveredAt: string; // ISO
  subtotal: number;
  vendorPromo: number;
  items: VendorOrderLine[];
}

export type EarningsRange = "today" | "7d" | "30d";

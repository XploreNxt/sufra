import type { VendorMenuItem, VendorOrder, VendorSale } from "@/types/vendor";

export const RESTAURANT_NAME = "Surfa Kitchen";
/** Platform commission on food sales (matches the web vendor portal default). */
export const COMMISSION_RATE = 15;

export const CATEGORIES = ["Thalis", "Starters", "Main Course", "Drinks", "Desserts"];

export const MOCK_MENU: VendorMenuItem[] = [
  { id: "m1", name: "Chicken Karahi", description: "Half kg, served with naan", price: 1450, category: "Main Course", emoji: "🍛", isAvailable: true },
  { id: "m2", name: "Beef Biryani", description: "Dum style, raita included", price: 680, category: "Main Course", emoji: "🍚", isAvailable: true },
  { id: "m3", name: "Chicken Tikka", description: "Six pieces, mint chutney", price: 520, category: "Starters", emoji: "🍢", isAvailable: false },
  { id: "m4", name: "Veg Samosa", description: "Two pieces, tamarind chutney", price: 180, category: "Starters", emoji: "🥟", isAvailable: true },
  { id: "m5", name: "Special Thali", description: "Dal, sabzi, rice and roti", price: 850, category: "Thalis", emoji: "🍱", isAvailable: true },
  { id: "m6", name: "Mango Lassi", description: "Chilled, 350 ml", price: 250, category: "Drinks", emoji: "🥭", isAvailable: false },
  { id: "m7", name: "Gulab Jamun", description: "Two pieces", price: 200, category: "Desserts", emoji: "🍮", isAvailable: true },
];

export const MOCK_ORDERS: VendorOrder[] = [
  {
    id: "SF-2041",
    placedAt: "2026-10-09T12:05:00Z",
    status: "pending",
    paymentMethod: "cash",
    items: [
      { name: "Chicken Karahi", quantity: 1, price: 1450 },
      { name: "Veg Samosa", quantity: 2, price: 180 },
    ],
    total: 1810,
  },
  {
    id: "SF-2040",
    placedAt: "2026-10-09T11:50:00Z",
    status: "preparing",
    paymentMethod: "card",
    items: [{ name: "Beef Biryani", quantity: 2, price: 680 }],
    total: 1360,
  },
  {
    id: "SF-2039",
    placedAt: "2026-10-09T11:20:00Z",
    status: "ready",
    paymentMethod: "cash",
    items: [{ name: "Special Thali", quantity: 1, price: 850 }],
    total: 850,
  },
  {
    id: "SF-2035",
    placedAt: "2026-10-08T19:10:00Z",
    status: "delivered",
    paymentMethod: "cash",
    items: [{ name: "Gulab Jamun", quantity: 3, price: 200 }],
    total: 600,
  },
];

/** Seven days of delivered sales, used for earnings and the chart. */
export const MOCK_SALES: VendorSale[] = Array.from({ length: 30 }, (_, i) => {
  const day = new Date(Date.UTC(2026, 9, 9, 14) - i * 86_400_000);
  const base = 9000 + ((i * 1733) % 7000);
  const promo = i % 4 === 0 ? 300 : 0;
  return {
    id: `S${i}`,
    deliveredAt: day.toISOString(),
    subtotal: base,
    vendorPromo: promo,
    items: [
      { name: "Chicken Karahi", quantity: 1 + (i % 3), price: 1450 },
      { name: "Beef Biryani", quantity: 2 + (i % 2), price: 680 },
      { name: "Veg Samosa", quantity: 3, price: 180 },
      { name: "Mango Lassi", quantity: 1 + (i % 2), price: 250 },
    ],
  };
});

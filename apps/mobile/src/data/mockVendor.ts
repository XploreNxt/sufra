import type { VendorMenuItem, VendorOrder, VendorSale } from "@/types/vendor";

export const RESTAURANT_NAME = "Surfa Kitchen";
/** Platform commission on food sales (matches the web vendor portal default). */
export const COMMISSION_RATE = 15;

export const CATEGORIES = ["Burgers", "Pizza", "Main Course", "Starters", "Drinks", "Desserts"];

// Photos reuse the Unsplash images the customer app already ships with.
// Items without a matching photo show a "No photo" tile until one is added.
const BURGER_PHOTO =
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85";
const PIZZA_PHOTO =
  "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85";
const MANGO_PHOTO =
  "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85";

export const MOCK_MENU: VendorMenuItem[] = [
  { id: "m1", name: "Classic Smash Burger", description: "Double beef patty, cheddar, house sauce", price: 1150, category: "Burgers", image_url: BURGER_PHOTO, isAvailable: true },
  { id: "m2", name: "Wood-Fired Margherita", description: "Mozzarella, basil, ripe tomatoes", price: 1390, category: "Pizza", image_url: PIZZA_PHOTO, isAvailable: true },
  { id: "m3", name: "Chicken Karahi", description: "Half kg, served with naan", price: 1450, category: "Main Course", image_url: null, isAvailable: true },
  { id: "m4", name: "Beef Biryani", description: "Dum style, raita included", price: 680, category: "Main Course", image_url: null, isAvailable: true },
  { id: "m5", name: "Special Thali", description: "Dal, sabzi, rice and roti", price: 850, category: "Main Course", image_url: null, isAvailable: true },
  { id: "m6", name: "Chicken Tikka", description: "Six pieces, mint chutney", price: 520, category: "Starters", image_url: null, isAvailable: false },
  { id: "m7", name: "Veg Samosa", description: "Two pieces, tamarind chutney", price: 180, category: "Starters", image_url: null, isAvailable: true },
  { id: "m8", name: "Mango Lassi", description: "Chilled, 350 ml", price: 250, category: "Drinks", image_url: MANGO_PHOTO, isAvailable: false },
  { id: "m9", name: "Gulab Jamun", description: "Two pieces", price: 200, category: "Desserts", image_url: null, isAvailable: true },
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

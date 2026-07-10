export type UserRole = "customer" | "vendor" | "rider" | "admin";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "assigned"
  | "picked_up"
  | "on_the_way"
  | "delivered"
  | "rejected"
  | "cancelled";

export interface Profile {
  id: string;
  phone: string | null;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface DayHours {
  closed: boolean;
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export type RestaurantHours = Record<DayKey, DayHours>;

export const DAYS: Array<{ key: DayKey; label: string }> = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export function defaultHours(): RestaurantHours {
  const day: DayHours = { closed: false, open: "11:00", close: "23:00" };
  return {
    mon: { ...day },
    tue: { ...day },
    wed: { ...day },
    thu: { ...day },
    fri: { ...day },
    sat: { ...day },
    sun: { ...day },
  };
}

export interface Restaurant {
  id: string;
  owner_user_id: string;
  name: string;
  description: string | null;
  cuisine_types: string[];
  logo_url: string | null;
  cover_url: string | null;
  pending_logo_url: string | null;
  pending_cover_url: string | null;
  branding_rejection_reason: string | null;
  hours: RestaurantHours | null;
  address_text: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  commission_rate: number;
  min_order: number;
  delivery_fee: number;
  default_prep_minutes: number;
  status: "pending" | "active" | "suspended";
  is_open: boolean;
  rating_avg: number | null;
  created_at: string;
}

export interface Modifier {
  id: string;
  group_id: string;
  name: string;
  price_delta: number;
}

export interface ModifierGroup {
  id: string;
  menu_item_id: string;
  name: string;
  min_select: number;
  max_select: number;
  is_required: boolean;
  modifiers: Modifier[];
}

export type MenuItemStatus = "approved" | "pending" | "rejected";

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  status: MenuItemStatus;
  rejection_reason: string | null;
  modifier_groups: ModifierGroup[];
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  menu_items: MenuItem[];
}

export type RestaurantWithMenu = Restaurant & {
  menu_categories: MenuCategory[];
};

export interface BundleItemRef {
  id: string;
  quantity: number;
  menu_items: { name: string } | null;
}

export interface Bundle {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  is_active: boolean;
  sort_order: number;
  bundle_items: BundleItemRef[];
}

/** "Rs 1,400" — prices come back from Postgres numeric as strings. */
export function formatPrice(value: number | string): string {
  return `Rs ${Number(value).toLocaleString("en-PK")}`;
}

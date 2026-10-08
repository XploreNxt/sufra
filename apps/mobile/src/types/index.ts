export type MenuItemStatus = "approved" | "pending" | "rejected";

export interface FoodModifier {
  id: string;
  group_id: string;
  name: string;
  price_delta: number;
}

export interface FoodModifierGroup {
  id: string;
  menu_item_id: string;
  name: string;
  min_select: number;
  max_select: number;
  is_required: boolean;
  modifiers: FoodModifier[];
}

export interface FoodItem {
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
  modifier_groups: FoodModifierGroup[];
  rating_avg: number;
  rating_count: number;
  restaurant_name: string;
  cuisine: string;
  image_blurhash: string;
}

export interface FoodCategory {
  id: string;
  name: string;
  image_url: string | null;
  image_blurhash: string;
}

export interface PromoSlide {
  id: string;
  eyebrow: string;
  title: string;
  offer: string;
  food: FoodItem;
}

export function formatPrice(value: number | string): string {
  return `Rs ${Number(value).toLocaleString("en-PK")}`;
}

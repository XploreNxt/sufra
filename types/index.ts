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

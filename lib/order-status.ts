import type { OrderStatus } from "@/types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Waiting for restaurant",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for pickup",
  assigned: "Rider assigned",
  picked_up: "Picked up",
  on_the_way: "On the way",
  delivered: "Delivered",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-sky-100 text-sky-800",
  preparing: "bg-sky-100 text-sky-800",
  ready: "bg-indigo-100 text-indigo-800",
  assigned: "bg-indigo-100 text-indigo-800",
  picked_up: "bg-violet-100 text-violet-800",
  on_the_way: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-neutral-200 text-neutral-600",
};

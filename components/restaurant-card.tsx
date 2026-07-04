import Link from "next/link";
import type { Restaurant } from "@/types";
import { formatPrice } from "@/types";

const PLACEHOLDER_GRADIENTS = [
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-500",
  "from-violet-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-rose-500 to-pink-600",
];

function gradientFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return PLACEHOLDER_GRADIENTS[Math.abs(hash) % PLACEHOLDER_GRADIENTS.length];
}

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const closed = !restaurant.is_open;

  return (
    <Link
      href={`/restaurant/${restaurant.id}`}
      className={`group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 transition hover:shadow-md ${
        closed ? "opacity-70" : ""
      }`}
    >
      <div
        className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${gradientFor(
          restaurant.name
        )}`}
      >
        <span className="text-4xl font-black text-white/90">
          {restaurant.name
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")}
        </span>
        {closed && (
          <span className="absolute left-3 top-3 rounded-full bg-neutral-900/80 px-2.5 py-1 text-xs font-semibold text-white">
            Closed
          </span>
        )}
        {restaurant.rating_avg != null && (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2 py-1 text-xs font-bold text-neutral-800">
            ★ {Number(restaurant.rating_avg).toFixed(1)}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 group-hover:text-emerald-700">
          {restaurant.name}
        </h3>
        <p className="mt-0.5 text-sm text-neutral-500">
          {restaurant.cuisine_types.join(" · ")}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
          <span>~{restaurant.default_prep_minutes} min</span>
          <span>Delivery {formatPrice(restaurant.delivery_fee)}</span>
          <span>Min {formatPrice(restaurant.min_order)}</span>
        </div>
      </div>
    </Link>
  );
}

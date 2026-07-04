import Link from "next/link";
import { notFound } from "next/navigation";
import { getRestaurantWithMenu } from "@/lib/db/restaurants";
import { formatPrice } from "@/types";
import { RestaurantMenu } from "@/components/restaurant-menu";

export const dynamic = "force-dynamic";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const restaurant = await getRestaurantWithMenu(id).catch(() => null);
  if (!restaurant || restaurant.status !== "active") notFound();

  return (
    <main className="pb-24">
      <Link
        href="/"
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← All restaurants
      </Link>

      <div className="mt-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {restaurant.name}
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              {restaurant.cuisine_types.join(" · ")}
            </p>
            {restaurant.description && (
              <p className="mt-2 max-w-xl text-sm text-neutral-600">
                {restaurant.description}
              </p>
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              restaurant.is_open
                ? "bg-emerald-100 text-emerald-800"
                : "bg-neutral-200 text-neutral-600"
            }`}
          >
            {restaurant.is_open ? "Open now" : "Closed"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-600">
          {restaurant.rating_avg != null && (
            <span>★ {Number(restaurant.rating_avg).toFixed(1)}</span>
          )}
          <span>~{restaurant.default_prep_minutes} min prep</span>
          <span>Delivery {formatPrice(restaurant.delivery_fee)}</span>
          <span>Min order {formatPrice(restaurant.min_order)}</span>
        </div>
      </div>

      <RestaurantMenu restaurant={restaurant} />
    </main>
  );
}

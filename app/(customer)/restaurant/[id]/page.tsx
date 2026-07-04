import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getRestaurantReviews,
  getRestaurantWithMenu,
} from "@/lib/db/restaurants";
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
  const reviews = await getRestaurantReviews(id).catch(() => []);

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

      {reviews.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-neutral-900">
            What customers say
          </h2>
          <div className="mt-3 space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-neutral-200"
              >
                <p className="text-amber-500">
                  {"★".repeat(rev.restaurant_rating ?? 0)}
                  <span className="text-neutral-200">
                    {"★".repeat(5 - (rev.restaurant_rating ?? 0))}
                  </span>
                  <span className="ml-2 text-xs text-neutral-400">
                    {new Date(rev.created_at).toLocaleDateString("en-PK", {
                      dateStyle: "medium",
                    })}
                  </span>
                </p>
                {rev.comment && (
                  <p className="mt-1 text-sm text-neutral-600">
                    “{rev.comment}”
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getRestaurantReviews,
  getRestaurantWithMenu,
} from "@/lib/db/restaurants";
import { formatPrice } from "@/types";
import type { DayKey } from "@/types";
import { RestaurantMenu } from "@/components/restaurant-menu";

export const dynamic = "force-dynamic";

const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const restaurant = await getRestaurantWithMenu(id).catch(() => null);
  if (!restaurant || restaurant.status !== "active") notFound();
  const reviews = await getRestaurantReviews(id).catch(() => []);

  const today = restaurant.hours?.[DAY_KEYS[new Date().getDay()]];
  const hoursLabel = today
    ? today.closed
      ? "Closed today"
      : `${today.open}–${today.close}`
    : null;

  return (
    <main className="pb-28">
      <Link
        href="/"
        className="s-fade text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-900"
      >
        ← All restaurants
      </Link>

      {/* Header */}
      <div className="s-fade-up mt-3 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200/80">
        {restaurant.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.cover_url}
            alt={restaurant.name}
            className="h-40 w-full object-cover sm:h-52"
          />
        ) : (
          <div className="s-shimmer h-1.5 w-full" />
        )}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {restaurant.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={restaurant.logo_url}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-stone-200"
                />
              )}
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
                  {restaurant.name}
                </h1>
                <p className="mt-1 text-sm font-semibold text-stone-500">
                  {restaurant.cuisine_types.join(" · ")}
                </p>
                {restaurant.description && (
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-600">
                    {restaurant.description}
                  </p>
                )}
              </div>
            </div>
            {restaurant.is_open ? (
              <span className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-800">
                <span className="s-live-dot text-emerald-500" /> Open now
              </span>
            ) : (
              <span className="rounded-full bg-stone-200 px-4 py-1.5 text-sm font-bold text-stone-600">
                Closed
              </span>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            {restaurant.rating_avg != null && (
              <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">
                ★ {Number(restaurant.rating_avg).toFixed(1)}
              </span>
            )}
            <span className="rounded-full bg-stone-100 px-3 py-1.5 text-stone-600">
              ⏱ ~{restaurant.default_prep_minutes} min prep
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1.5 text-stone-600">
              🛵 Delivery {formatPrice(restaurant.delivery_fee)}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1.5 text-stone-600">
              Min order {formatPrice(restaurant.min_order)}
            </span>
            {hoursLabel && (
              <span className="rounded-full bg-stone-100 px-3 py-1.5 text-stone-600">
                🕒 {hoursLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <RestaurantMenu restaurant={restaurant} />

      {reviews.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-extrabold tracking-tight text-stone-900">
            What customers say
          </h2>
          <div className="s-stagger mt-4 space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/80"
              >
                <p className="text-amber-400">
                  {"★".repeat(rev.restaurant_rating ?? 0)}
                  <span className="text-stone-200">
                    {"★".repeat(5 - (rev.restaurant_rating ?? 0))}
                  </span>
                  <span className="ml-2 text-xs font-medium text-stone-400">
                    {new Date(rev.created_at).toLocaleDateString("en-PK", {
                      dateStyle: "medium",
                    })}
                  </span>
                </p>
                {rev.comment && (
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
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

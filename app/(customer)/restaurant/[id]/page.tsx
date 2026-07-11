import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  getRestaurantBundles,
  getRestaurantReviews,
  getRestaurantWithMenu,
} from "@/lib/db/restaurants";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/types";
import type { DayKey } from "@/types";
import { RestaurantMenu } from "@/components/restaurant-menu";
import { FavoriteButton } from "@/components/customer/favorite-button";
import { nextOpeningLabel } from "@/lib/hours";
import {
  LOCATION_COOKIE,
  parseLocationCookie,
  haversineKm,
  formatDistance,
  deliveryFeeForKm,
  DELIVERY_BASE_FEE,
} from "@/lib/geo";

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
  const [reviews, bundles] = await Promise.all([
    getRestaurantReviews(id).catch(() => []),
    getRestaurantBundles(id).catch(() => []),
  ]);

  const profile = await getSessionProfile();
  let isFavorited = false;
  if (profile) {
    const supabase = await createClient();
    const { data: fav } = await supabase
      .from("favorites")
      .select("id")
      .eq("restaurant_id", id)
      .maybeSingle();
    isFavorited = !!fav;
  }

  const cookieStore = await cookies();
  const loc = parseLocationCookie(cookieStore.get(LOCATION_COOKIE)?.value);
  const distance =
    loc && restaurant.lat != null && restaurant.lng != null
      ? haversineKm(loc.lat, loc.lng, restaurant.lat, restaurant.lng)
      : null;
  const outOfRange =
    distance != null && distance > Number(restaurant.delivery_radius_km);

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
            <div className="flex flex-col items-end gap-2">
              {restaurant.is_open ? (
                <span className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-800">
                  <span className="s-live-dot text-emerald-500" /> Open now
                </span>
              ) : (
                <span className="rounded-full bg-stone-200 px-4 py-1.5 text-sm font-bold text-stone-600">
                  Closed
                </span>
              )}
              <FavoriteButton
                restaurantId={restaurant.id}
                initial={isFavorited}
                loggedIn={!!profile}
              />
            </div>
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
              🛵 Delivery{" "}
              {distance != null
                ? `~${formatPrice(deliveryFeeForKm(distance))}`
                : `from ${formatPrice(DELIVERY_BASE_FEE)}`}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1.5 text-stone-600">
              Min order {formatPrice(restaurant.min_order)}
            </span>
            {hoursLabel && (
              <span className="rounded-full bg-stone-100 px-3 py-1.5 text-stone-600">
                🕒 {hoursLabel}
              </span>
            )}
            {distance != null && !outOfRange && (
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 font-semibold text-emerald-800">
                📍 {formatDistance(distance)} away
              </span>
            )}
          </div>
        </div>
      </div>

      {!restaurant.is_open && (
        <div className="s-fade-up mt-4 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-bold">Closed right now</p>
          <p className="mt-0.5">
            {nextOpeningLabel(restaurant.hours) ?? "Check back later"} — browse the
            menu and order once it reopens.
          </p>
        </div>
      )}

      {outOfRange && (
        <div className="s-fade-up mt-4 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-bold">Outside this restaurant’s delivery area</p>
          <p className="mt-0.5">
            You’re {formatDistance(distance!)} away, but they only deliver within{" "}
            {Number(restaurant.delivery_radius_km)} km. You can browse the menu,
            but orders to your location will be declined at checkout.
          </p>
        </div>
      )}

      <RestaurantMenu
        restaurant={restaurant}
        bundles={bundles}
        defaultSpice={profile?.default_spice ?? null}
      />

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

import { cookies } from "next/headers";
import { getActiveRestaurants } from "@/lib/db/restaurants";
import { getSessionProfile } from "@/lib/auth/session";
import { RestaurantFeed } from "@/components/restaurant-feed";
import { LocationGate } from "@/components/location-gate";
import { LocationBar } from "@/components/location-bar";
import { LOCATION_COOKIE, parseLocationCookie } from "@/lib/geo";

export const dynamic = "force-dynamic";

export default async function CustomerHome() {
  const cookieStore = await cookies();
  const loc = parseLocationCookie(cookieStore.get(LOCATION_COOKIE)?.value);

  if (!loc) {
    return (
      <main>
        <LocationGate />
      </main>
    );
  }

  const profile = await getSessionProfile();
  const restaurants = await getActiveRestaurants(
    loc,
    profile?.favorite_cuisines ?? []
  );

  return (
    <main>
      <LocationBar label={loc.label} />
      {restaurants.length === 0 ? (
        <div className="s-fade-up mt-10 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-stone-200">
          <p className="text-5xl">🛵</p>
          <h2 className="mt-3 text-xl font-extrabold tracking-tight text-stone-900">
            No kitchens deliver here yet
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">
            None of our restaurants cover this spot right now. Try a different
            location — tap “Change” above to move your pin.
          </p>
        </div>
      ) : (
        <RestaurantFeed restaurants={restaurants} />
      )}
    </main>
  );
}

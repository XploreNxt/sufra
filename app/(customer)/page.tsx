import { getActiveRestaurants } from "@/lib/db/restaurants";
import { RestaurantFeed } from "@/components/restaurant-feed";

export const dynamic = "force-dynamic";

export default async function CustomerHome() {
  const restaurants = await getActiveRestaurants();

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">
        What are you craving?
      </h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Order from {restaurants.length} restaurants delivering near you.
      </p>
      <RestaurantFeed restaurants={restaurants} />
    </main>
  );
}

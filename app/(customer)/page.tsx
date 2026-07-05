import { getActiveRestaurants } from "@/lib/db/restaurants";
import { RestaurantFeed } from "@/components/restaurant-feed";

export const dynamic = "force-dynamic";

export default async function CustomerHome() {
  const restaurants = await getActiveRestaurants();

  return (
    <main>
      <RestaurantFeed restaurants={restaurants} />
    </main>
  );
}

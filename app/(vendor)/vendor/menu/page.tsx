import { getActiveRestaurant, getVendorMenu } from "@/lib/db/vendor";
import { MenuManager } from "@/components/vendor/menu-manager";

export const dynamic = "force-dynamic";

export default async function VendorMenuPage() {
  const { restaurant } = await getActiveRestaurant();
  if (!restaurant) return null;

  const menu = await getVendorMenu(restaurant.id);
  if (!menu) return null;

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">
        Menu · {restaurant.name}
      </h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Add categories, then items with photos. Item options (spice level,
        add-ons) are managed by support for now.
      </p>
      <MenuManager restaurant={menu} />
    </main>
  );
}

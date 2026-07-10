import {
  getActiveRestaurant,
  getVendorBundles,
  getVendorMenu,
} from "@/lib/db/vendor";
import { MenuManager } from "@/components/vendor/menu-manager";
import { BundleManager } from "@/components/vendor/bundle-manager";

export const dynamic = "force-dynamic";

export default async function VendorMenuPage() {
  const { restaurant } = await getActiveRestaurant();
  if (!restaurant) return null;

  const [menu, bundles] = await Promise.all([
    getVendorMenu(restaurant.id),
    getVendorBundles(restaurant.id),
  ]);
  if (!menu) return null;

  const menuItems = menu.menu_categories.flatMap((c) =>
    c.menu_items.map((mi) => ({ id: mi.id, name: mi.name, price: mi.price }))
  );

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">
        Menu · {restaurant.name}
      </h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Add categories, then items with photos. Item options (spice level,
        add-ons) are managed by support for now.
      </p>
      <BundleManager
        restaurantId={restaurant.id}
        bundles={bundles}
        menuItems={menuItems}
      />
      <MenuManager restaurant={menu} />
    </main>
  );
}

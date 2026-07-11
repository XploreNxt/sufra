import { getActiveRestaurant } from "@/lib/db/vendor";
import { SettingsForm } from "@/components/vendor/settings-form";
import { LocationManager } from "@/components/vendor/location-manager";
import { ShopProfile } from "@/components/vendor/shop-profile";

export const dynamic = "force-dynamic";

export default async function VendorSettingsPage() {
  const { restaurant } = await getActiveRestaurant();
  if (!restaurant) return null;

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Manage your location, delivery area, logo, cover photo and shop timings.
      </p>
      <div className="space-y-6">
        <LocationManager restaurant={restaurant} />
        <ShopProfile restaurant={restaurant} />
        <SettingsForm restaurant={restaurant} />
      </div>
    </main>
  );
}

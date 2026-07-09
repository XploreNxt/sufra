import { getActiveRestaurant } from "@/lib/db/vendor";
import { SettingsForm } from "@/components/vendor/settings-form";

export const dynamic = "force-dynamic";

export default async function VendorSettingsPage() {
  const { restaurant } = await getActiveRestaurant();
  if (!restaurant) return null;

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Manage your logo, cover photo and shop timings.
      </p>
      <SettingsForm restaurant={restaurant} />
    </main>
  );
}

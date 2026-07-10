import { getActiveRestaurant, getVendorVouchers } from "@/lib/db/vendor";
import { PromosManager } from "@/components/vendor/promos-manager";

export const dynamic = "force-dynamic";

export default async function VendorPromosPage() {
  const { restaurant } = await getActiveRestaurant();
  if (!restaurant) return null;

  const vouchers = await getVendorVouchers(restaurant.id);

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">Promo codes</h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Discount codes customers enter at checkout. They only work at your
        restaurant, and the discount comes out of your earnings.
      </p>
      <PromosManager restaurantId={restaurant.id} vouchers={vouchers} />
    </main>
  );
}

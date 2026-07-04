import { getRestaurantsAdmin } from "@/lib/db/admin";
import { VendorsTable } from "@/components/admin/vendors-table";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  const restaurants = await getRestaurantsAdmin();

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">Vendors</h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Approve new restaurants, set commission and delivery fees, or suspend.
      </p>
      <VendorsTable restaurants={restaurants} />
    </main>
  );
}

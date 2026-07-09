import { getRestaurantsAdmin } from "@/lib/db/admin";
import { VendorsTable } from "@/components/admin/vendors-table";
import { AddVendorForm } from "@/components/admin/add-vendor-form";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  const restaurants = await getRestaurantsAdmin();

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">Vendors</h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Add a new restaurant, or approve, re-price and suspend existing ones.
      </p>
      <AddVendorForm />
      <VendorsTable restaurants={restaurants} />
    </main>
  );
}

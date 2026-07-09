import { getRidersAdmin } from "@/lib/db/admin";
import { RidersTable } from "@/components/admin/riders-table";
import { AddRiderForm } from "@/components/admin/add-rider-form";

export const dynamic = "force-dynamic";

export default async function AdminRidersPage() {
  const riders = await getRidersAdmin();

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">Riders</h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Add a new rider, or approve, suspend and reactivate existing ones.
      </p>
      <AddRiderForm />
      <RidersTable riders={riders} />
    </main>
  );
}

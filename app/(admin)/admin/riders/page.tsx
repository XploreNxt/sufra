import { getRidersAdmin } from "@/lib/db/admin";
import { RidersTable } from "@/components/admin/riders-table";

export const dynamic = "force-dynamic";

export default async function AdminRidersPage() {
  const riders = await getRidersAdmin();

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">Riders</h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Approve rider applications; suspending forces a rider offline.
      </p>
      <RidersTable riders={riders} />
    </main>
  );
}

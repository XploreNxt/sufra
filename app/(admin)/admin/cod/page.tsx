import { getCodLedgerAdmin } from "@/lib/db/admin";
import { CodTable } from "@/components/admin/cod-table";

export const dynamic = "force-dynamic";

export default async function AdminCodPage() {
  const ledger = await getCodLedgerAdmin();

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">COD settlement</h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Riders hand over collected cash minus their delivery fees. Settling
        marks the ledger rows as cleared.
      </p>
      <CodTable ledger={ledger} />
    </main>
  );
}

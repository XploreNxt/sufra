import { getPendingMenuItems } from "@/lib/db/admin";
import { MenuApprovals } from "@/components/admin/menu-approvals";

export const dynamic = "force-dynamic";

export default async function AdminMenuApprovalsPage() {
  const items = await getPendingMenuItems();

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">
        Menu approvals
        {items.length > 0 && (
          <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-800">
            {items.length}
          </span>
        )}
      </h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        New and edited menu items wait here until you approve them. Rejecting
        asks for a reason the vendor will see.
      </p>
      <MenuApprovals items={items} />
    </main>
  );
}

import { getPendingBranding, getPendingMenuItems } from "@/lib/db/admin";
import { MenuApprovals } from "@/components/admin/menu-approvals";
import { BrandingApprovals } from "@/components/admin/branding-approvals";

export const dynamic = "force-dynamic";

export default async function AdminApprovalsPage() {
  const [items, branding] = await Promise.all([
    getPendingMenuItems(),
    getPendingBranding(),
  ]);
  const total = items.length + branding.length;

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">
        Approvals
        {total > 0 && (
          <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-800">
            {total}
          </span>
        )}
      </h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Menu items and restaurant branding wait here until you approve them.
        Rejecting asks for a reason the vendor will see.
      </p>

      <BrandingApprovals items={branding} />

      <h2 className="text-lg font-bold text-stone-900">Menu items</h2>
      <div className="mt-3">
        <MenuApprovals items={items} />
      </div>
    </main>
  );
}

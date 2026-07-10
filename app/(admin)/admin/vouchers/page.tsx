import { createClient } from "@/lib/supabase/server";
import {
  VouchersManager,
  type VoucherRow,
} from "@/components/admin/vouchers-manager";

export const dynamic = "force-dynamic";

export default async function AdminVouchersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vouchers")
    .select(
      "id, code, discount_type, value, min_order, max_discount, valid_to, usage_limit, times_used, is_active"
    )
    .is("restaurant_id", null) // platform-wide only; vendors manage their own
    .order("is_active", { ascending: false })
    .order("code");

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">
        Platform vouchers
      </h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Sufra-wide discount codes that work at any restaurant. Vendors create
        their own codes in their panel.
      </p>
      <VouchersManager vouchers={(data ?? []) as VoucherRow[]} />
    </main>
  );
}

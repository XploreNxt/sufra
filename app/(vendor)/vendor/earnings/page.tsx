import { getActiveRestaurant, getDeliveredOrders } from "@/lib/db/vendor";
import { formatPrice } from "@/types";
import { formatDateTime, resolveRange } from "@/lib/datetime";
import { DateRangeFilter } from "@/components/date-range-filter";

export const dynamic = "force-dynamic";

const RANGE_LABEL: Record<string, string> = {
  all: "All time",
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  custom: "Selected dates",
};

export default async function VendorEarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { restaurant } = await getActiveRestaurant();
  if (!restaurant) return null;

  const { key, range } = resolveRange(await searchParams);
  const delivered = await getDeliveredOrders(restaurant.id, range);
  const rate = Number(restaurant.commission_rate);

  // A vendor's own promo code (voucher scoped to this restaurant) comes out of
  // their food sales. Platform-wide (admin) codes don't.
  const vendorFunded = (o: (typeof delivered)[number]) =>
    o.vouchers?.restaurant_id ? Number(o.discount) : 0;
  const foodSalesOf = (o: (typeof delivered)[number]) =>
    Number(o.subtotal) - vendorFunded(o);

  const gross = delivered.reduce((s, o) => s + foodSalesOf(o), 0);
  const commission = (gross * rate) / 100;
  const net = gross - commission;

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">Earnings</h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Net payout = food sales − platform commission. Delivery fees go to
        riders and the platform.
      </p>

      <DateRangeFilter />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <h3 className="text-sm font-medium text-neutral-500">
            Net payout · {RANGE_LABEL[key]}
          </h3>
          <p className="mt-1 text-2xl font-bold text-neutral-900">
            {formatPrice(net)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {delivered.length} orders delivered
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <h3 className="text-sm font-medium text-neutral-500">Food sales</h3>
          <p className="mt-1 text-2xl font-bold text-neutral-900">
            {formatPrice(gross)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">gross before commission</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <h3 className="text-sm font-medium text-neutral-500">
            Commission ({rate}%)
          </h3>
          <p className="mt-1 text-2xl font-bold text-neutral-900">
            −{formatPrice(commission)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">platform fee</p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-bold text-neutral-900">
        Delivered orders
      </h2>
      {delivered.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-400">
          No delivered orders in this period.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-neutral-200">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 font-medium">Delivered</th>
                <th className="px-4 py-2.5 text-right font-medium">Food sales</th>
                <th className="px-4 py-2.5 text-right font-medium">Your net</th>
              </tr>
            </thead>
            <tbody>
              {delivered.map((o) => {
                const foodSales = foodSalesOf(o);
                const rowNet = foodSales * (1 - rate / 100);
                return (
                  <tr key={o.id} className="border-t border-neutral-100">
                    <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">
                      #{o.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600">
                      {o.delivered_at ? formatDateTime(o.delivered_at) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {formatPrice(foodSales)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">
                      {formatPrice(rowNet)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

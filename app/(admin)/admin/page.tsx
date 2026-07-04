import Link from "next/link";
import { getAdminStats, getAllOrders } from "@/lib/db/admin";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/order-status";
import { formatPrice } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [stats, orders] = await Promise.all([getAdminStats(), getAllOrders()]);
  const recent = orders.slice(0, 8);

  const cards = [
    { label: "Orders today", value: String(stats.ordersToday) },
    { label: "GMV (delivered)", value: formatPrice(stats.gmvDelivered) },
    { label: "Commission earned", value: formatPrice(stats.commissionEarned) },
    { label: "Deliveries completed", value: String(stats.deliveredCount) },
    {
      label: "Active restaurants",
      value: String(stats.activeRestaurants),
      hint: stats.pendingRestaurants
        ? `${stats.pendingRestaurants} pending approval`
        : undefined,
      href: "/admin/vendors",
    },
    {
      label: "Riders online",
      value: String(stats.ridersOnline),
      hint: stats.pendingRiders
        ? `${stats.pendingRiders} pending approval`
        : undefined,
      href: "/admin/riders",
    },
    {
      label: "Unsettled COD",
      value: formatPrice(stats.unsettledCod),
      hint: "cash with riders",
      href: "/admin/cod",
    },
  ];

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">Overview</h1>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const body = (
            <>
              <h3 className="text-sm font-medium text-neutral-500">{c.label}</h3>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                {c.value}
              </p>
              {c.hint && (
                <p className="mt-1 text-xs font-medium text-amber-700">
                  {c.hint}
                </p>
              )}
            </>
          );
          return c.href ? (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 transition hover:shadow-md"
            >
              {body}
            </Link>
          ) : (
            <div
              key={c.label}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"
            >
              {body}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900">Recent orders</h2>
        <Link
          href="/admin/orders"
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          Live monitor →
        </Link>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Order</th>
              <th className="px-4 py-2.5 font-medium">Restaurant</th>
              <th className="px-4 py-2.5 font-medium">Placed</th>
              <th className="px-4 py-2.5 text-right font-medium">Total</th>
              <th className="px-4 py-2.5 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((o) => (
              <tr key={o.id} className="border-t border-neutral-100">
                <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">
                  #{o.id.slice(0, 8)}
                </td>
                <td className="px-4 py-2.5">{o.restaurants?.name}</td>
                <td className="px-4 py-2.5 text-neutral-500">
                  {new Date(o.placed_at).toLocaleString("en-PK", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-4 py-2.5 text-right">{formatPrice(o.total)}</td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status]}`}
                  >
                    {STATUS_LABELS[o.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

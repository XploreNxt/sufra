import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { getMyOrders } from "@/lib/db/orders";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/order-status";
import { formatPrice } from "@/types";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?next=/orders");

  const orders = await getMyOrders();

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-neutral-900">Your orders</h1>

      {orders.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-neutral-500">No orders yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
          >
            Browse restaurants
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 transition hover:shadow-md"
            >
              <div>
                <h3 className="font-semibold text-neutral-900">
                  {o.restaurants?.name ?? "Restaurant"}
                </h3>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {new Date(o.placed_at).toLocaleString("en-PK", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status]}`}
                >
                  {STATUS_LABELS[o.status]}
                </span>
                <p className="mt-1 font-semibold text-neutral-900">
                  {formatPrice(o.total)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

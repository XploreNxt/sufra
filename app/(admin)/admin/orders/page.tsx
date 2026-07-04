import { getAllOrders, getAssignableRiders } from "@/lib/db/admin";
import { OrdersMonitor } from "@/components/admin/orders-monitor";
import { RealtimeRefresh } from "@/components/realtime-refresh";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const [orders, riders] = await Promise.all([
    getAllOrders(),
    getAssignableRiders(),
  ]);

  return (
    <main>
      <RealtimeRefresh channel="admin-orders" tables={[{ table: "orders" }]} />
      <h1 className="text-2xl font-bold text-neutral-900">Order monitor</h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Updates live. Assign or reassign riders on orders that are ready;
        cancel refunds paid amounts.
      </p>
      <OrdersMonitor orders={orders} riders={riders} />
    </main>
  );
}

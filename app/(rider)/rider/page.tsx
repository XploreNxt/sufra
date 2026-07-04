import {
  getActiveDelivery,
  getAvailableOrders,
  getRiderProfile,
} from "@/lib/db/rider";
import { ActiveDeliveryCard } from "@/components/rider/active-delivery";
import { AvailableOrdersList } from "@/components/rider/available-orders";
import { AutoRefresh } from "@/components/vendor/auto-refresh";

export const dynamic = "force-dynamic";

export default async function RiderHomePage() {
  const rider = await getRiderProfile();
  if (!rider) return null; // layout renders the empty state

  const active = await getActiveDelivery();

  if (active) {
    return (
      <main>
        <AutoRefresh seconds={20} />
        <h1 className="text-xl font-bold text-neutral-900">Current delivery</h1>
        <div className="mt-4">
          <ActiveDeliveryCard delivery={active} />
        </div>
      </main>
    );
  }

  if (!rider.is_online) {
    return (
      <main className="py-16 text-center">
        <h1 className="text-xl font-bold text-neutral-900">You're offline</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Go online (top right) to see deliveries waiting for pickup.
        </p>
      </main>
    );
  }

  const available = await getAvailableOrders();

  return (
    <main>
      <AutoRefresh seconds={15} />
      <h1 className="text-xl font-bold text-neutral-900">
        Available deliveries
        {available.length > 0 && (
          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            {available.length}
          </span>
        )}
      </h1>
      <AvailableOrdersList orders={available} />
    </main>
  );
}

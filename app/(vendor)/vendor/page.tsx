import { getActiveRestaurant, getVendorOrders } from "@/lib/db/vendor";
import { VendorOrderCard } from "@/components/vendor/order-card";
import { RealtimeRefresh } from "@/components/realtime-refresh";

export const dynamic = "force-dynamic";

export default async function VendorOrdersPage() {
  const { restaurant } = await getActiveRestaurant();
  if (!restaurant) return null; // layout renders the empty state

  const orders = await getVendorOrders(restaurant.id);

  const incoming = orders.filter((o) => o.status === "pending");
  const inProgress = orders.filter((o) =>
    ["accepted", "preparing"].includes(o.status)
  );
  const handedOff = orders.filter((o) =>
    ["ready", "assigned", "picked_up", "on_the_way"].includes(o.status)
  );
  const past = orders
    .filter((o) => ["delivered", "rejected", "cancelled"].includes(o.status))
    .slice(0, 10);

  const Section = ({
    title,
    list,
    empty,
  }: {
    title: string;
    list: typeof orders;
    empty: string;
  }) => (
    <section className="mt-6 first:mt-0">
      <h2 className="text-lg font-bold text-neutral-900">
        {title}
        {list.length > 0 && (
          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            {list.length}
          </span>
        )}
      </h2>
      {list.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-400">{empty}</p>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {list.map((o) => (
            <VendorOrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <main>
      <RealtimeRefresh
        channel={`vendor-orders-${restaurant.id}`}
        tables={[
          { table: "orders", filter: `restaurant_id=eq.${restaurant.id}` },
        ]}
      />
      <Section
        title="New orders"
        list={incoming}
        empty="No new orders — they'll appear here automatically."
      />
      <Section title="In the kitchen" list={inProgress} empty="Nothing cooking." />
      <Section
        title="Waiting for rider / on the way"
        list={handedOff}
        empty="No orders out for delivery."
      />
      <Section title="Recent history" list={past} empty="No past orders yet." />
    </main>
  );
}

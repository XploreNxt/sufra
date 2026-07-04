import { getActiveRestaurant, getDeliveredOrders } from "@/lib/db/vendor";
import { formatPrice } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorEarningsPage() {
  const { restaurant } = await getActiveRestaurant();
  if (!restaurant) return null;

  const delivered = await getDeliveredOrders(restaurant.id);
  const rate = Number(restaurant.commission_rate);

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const within = (days: number) =>
    delivered.filter(
      (o) => o.delivered_at && now - new Date(o.delivered_at).getTime() < days * DAY
    );

  const summarize = (rows: typeof delivered) => {
    const gross = rows.reduce((s, o) => s + Number(o.subtotal), 0);
    const commission = (gross * rate) / 100;
    return { count: rows.length, gross, commission, net: gross - commission };
  };

  const today = summarize(within(1));
  const week = summarize(within(7));
  const all = summarize(delivered);

  const Card = ({
    title,
    data,
  }: {
    title: string;
    data: ReturnType<typeof summarize>;
  }) => (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
      <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
      <p className="mt-1 text-2xl font-bold text-neutral-900">
        {formatPrice(data.net)}
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        {data.count} delivered · {formatPrice(data.gross)} gross −{" "}
        {formatPrice(data.commission)} commission ({rate}%)
      </p>
    </div>
  );

  return (
    <main>
      <h1 className="text-2xl font-bold text-neutral-900">Earnings</h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Net payout = food sales − platform commission. Delivery fees go to
        riders and the platform.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Today" data={today} />
        <Card title="Last 7 days" data={week} />
        <Card title="All time" data={all} />
      </div>

      <h2 className="mt-8 text-lg font-bold text-neutral-900">
        Delivered orders
      </h2>
      {delivered.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-400">
          Nothing delivered yet — earnings appear once orders complete.
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200">
          <table className="w-full text-sm">
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
                const net = Number(o.subtotal) * (1 - rate / 100);
                return (
                  <tr key={o.id} className="border-t border-neutral-100">
                    <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">
                      #{o.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600">
                      {o.delivered_at
                        ? new Date(o.delivered_at).toLocaleString("en-PK", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {formatPrice(o.subtotal)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">
                      {formatPrice(net)}
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

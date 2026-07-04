import { getCodLedger, getRiderProfile } from "@/lib/db/rider";
import { formatPrice } from "@/types";

export const dynamic = "force-dynamic";

export default async function RiderCodPage() {
  const rider = await getRiderProfile();
  if (!rider) return null;

  const ledger = await getCodLedger();
  const unsettled = ledger.filter((l) => !l.is_settled);

  const cashInHand = unsettled.reduce(
    (s, l) => s + Number(l.amount_collected),
    0
  );
  const owed = unsettled.reduce(
    (s, l) => s + Number(l.amount_owed_to_platform),
    0
  );
  const earningsAll = ledger.reduce(
    (s, l) => s + (Number(l.amount_collected) - Number(l.amount_owed_to_platform)),
    0
  );

  return (
    <main>
      <h1 className="text-xl font-bold text-neutral-900">Cash &amp; earnings</h1>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <h3 className="text-sm font-medium text-neutral-500">Cash in hand</h3>
          <p className="mt-1 text-2xl font-bold text-neutral-900">
            {formatPrice(cashInHand)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {unsettled.length} unsettled deliveries
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 p-5 shadow-sm ring-1 ring-amber-200">
          <h3 className="text-sm font-medium text-amber-700">
            Owed to platform
          </h3>
          <p className="mt-1 text-2xl font-bold text-amber-900">
            {formatPrice(owed)}
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Hand over at the next settlement
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-5 shadow-sm ring-1 ring-emerald-200">
          <h3 className="text-sm font-medium text-emerald-700">
            Delivery earnings (all time)
          </h3>
          <p className="mt-1 text-2xl font-bold text-emerald-900">
            {formatPrice(earningsAll)}
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            {ledger.length} completed COD deliveries
          </p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-bold text-neutral-900">Ledger</h2>
      {ledger.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-400">
          No COD deliveries yet — complete one and it shows up here.
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 text-right font-medium">Collected</th>
                <th className="px-4 py-2.5 text-right font-medium">You keep</th>
                <th className="px-4 py-2.5 text-right font-medium">Owed</th>
                <th className="px-4 py-2.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((l) => (
                <tr key={l.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">
                    #{l.order_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {formatPrice(l.amount_collected)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-emerald-700">
                    {formatPrice(
                      Number(l.amount_collected) - Number(l.amount_owed_to_platform)
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {formatPrice(l.amount_owed_to_platform)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        l.is_settled
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {l.is_settled ? "Settled" : "Unsettled"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

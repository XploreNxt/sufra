import { getCodLedger, getRiderProfile } from "@/lib/db/rider";
import { formatPrice } from "@/types";
import { formatDateTime, inRange, resolveRange } from "@/lib/datetime";
import { DateRangeFilter } from "@/components/date-range-filter";

export const dynamic = "force-dynamic";

const RANGE_LABEL: Record<string, string> = {
  all: "all time",
  today: "today",
  "7d": "last 7 days",
  "30d": "last 30 days",
  custom: "selected dates",
};

export default async function RiderCodPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const rider = await getRiderProfile();
  if (!rider) return null;

  const { key, range } = resolveRange(await searchParams);
  const ledger = await getCodLedger();

  // Current balances are not time-filtered — they are what the rider holds now.
  const unsettled = ledger.filter((l) => !l.is_settled);
  const cashInHand = unsettled.reduce((s, l) => s + Number(l.amount_collected), 0);
  const owed = unsettled.reduce(
    (s, l) => s + Number(l.amount_owed_to_platform),
    0
  );

  // Earnings + ledger table are filtered by when the delivery happened.
  const inWindow = ledger.filter((l) => inRange(l.delivered_at, range));
  const earnings = inWindow.reduce(
    (s, l) =>
      s + (Number(l.amount_collected) - Number(l.amount_owed_to_platform)),
    0
  );

  return (
    <main>
      <h1 className="text-xl font-bold text-neutral-900">Cash &amp; earnings</h1>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <h3 className="text-sm font-medium text-neutral-500">
            Cash in hand (now)
          </h3>
          <p className="mt-1 text-2xl font-bold text-neutral-900">
            {formatPrice(cashInHand)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {unsettled.length} unsettled deliveries
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 p-5 shadow-sm ring-1 ring-amber-200">
          <h3 className="text-sm font-medium text-amber-700">
            Owed to platform (now)
          </h3>
          <p className="mt-1 text-2xl font-bold text-amber-900">
            {formatPrice(owed)}
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Hand over at the next settlement
          </p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-bold text-neutral-900">
        Delivery earnings
      </h2>
      <div className="mt-3">
        <DateRangeFilter />
      </div>
      <div className="rounded-xl bg-emerald-50 p-5 shadow-sm ring-1 ring-emerald-200">
        <h3 className="text-sm font-medium text-emerald-700">
          Earnings · {RANGE_LABEL[key]}
        </h3>
        <p className="mt-1 text-2xl font-bold text-emerald-900">
          {formatPrice(earnings)}
        </p>
        <p className="mt-1 text-xs text-emerald-700">
          {inWindow.length} COD deliveries
        </p>
      </div>

      <h2 className="mt-8 text-lg font-bold text-neutral-900">Ledger</h2>
      {inWindow.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-400">
          No COD deliveries in this period.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-neutral-200">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 font-medium">Delivered</th>
                <th className="px-4 py-2.5 text-right font-medium">Collected</th>
                <th className="px-4 py-2.5 text-right font-medium">You keep</th>
                <th className="px-4 py-2.5 text-right font-medium">Owed</th>
                <th className="px-4 py-2.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {inWindow.map((l) => (
                <tr key={l.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">
                    #{l.order_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">
                    {l.delivered_at ? formatDateTime(l.delivered_at) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {formatPrice(l.amount_collected)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-emerald-700">
                    {formatPrice(
                      Number(l.amount_collected) -
                        Number(l.amount_owed_to_platform)
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

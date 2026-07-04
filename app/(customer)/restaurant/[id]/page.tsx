import Link from "next/link";
import { notFound } from "next/navigation";
import { getRestaurantWithMenu } from "@/lib/db/restaurants";
import { formatPrice } from "@/types";

export const dynamic = "force-dynamic";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const restaurant = await getRestaurantWithMenu(id).catch(() => null);
  if (!restaurant || restaurant.status !== "active") notFound();

  return (
    <main>
      <Link
        href="/"
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← All restaurants
      </Link>

      {/* Header */}
      <div className="mt-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {restaurant.name}
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              {restaurant.cuisine_types.join(" · ")}
            </p>
            {restaurant.description && (
              <p className="mt-2 max-w-xl text-sm text-neutral-600">
                {restaurant.description}
              </p>
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              restaurant.is_open
                ? "bg-emerald-100 text-emerald-800"
                : "bg-neutral-200 text-neutral-600"
            }`}
          >
            {restaurant.is_open ? "Open now" : "Closed"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-600">
          {restaurant.rating_avg != null && (
            <span>★ {Number(restaurant.rating_avg).toFixed(1)}</span>
          )}
          <span>~{restaurant.default_prep_minutes} min prep</span>
          <span>Delivery {formatPrice(restaurant.delivery_fee)}</span>
          <span>Min order {formatPrice(restaurant.min_order)}</span>
        </div>
      </div>

      {/* Menu */}
      {restaurant.menu_categories.map((cat) => (
        <section key={cat.id} className="mt-8">
          <h2 className="text-lg font-bold text-neutral-900">{cat.name}</h2>
          <div className="mt-3 space-y-3">
            {cat.menu_items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 ${
                  item.is_available ? "" : "opacity-60"
                }`}
              >
                <div>
                  <h3 className="font-semibold text-neutral-900">
                    {item.name}
                    {!item.is_available && (
                      <span className="ml-2 text-xs font-medium text-red-600">
                        Unavailable
                      </span>
                    )}
                  </h3>
                  {item.description && (
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {item.description}
                    </p>
                  )}
                  {item.modifier_groups.length > 0 && (
                    <p className="mt-1 text-xs font-medium text-emerald-700">
                      Customizable ·{" "}
                      {item.modifier_groups.map((g) => g.name).join(", ")}
                    </p>
                  )}
                </div>
                <span className="whitespace-nowrap font-semibold text-neutral-900">
                  {formatPrice(item.price)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <p className="mt-10 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">
        Cart &amp; checkout arrive in Phase 3 — browsing only for now.
      </p>
    </main>
  );
}

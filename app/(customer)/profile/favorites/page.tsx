import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { RestaurantCard } from "@/components/restaurant-card";
import type { Restaurant } from "@/types";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?next=/profile/favorites");

  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("restaurants(*)")
    .order("created_at", { ascending: false });

  const restaurants = ((data ?? [])
    .map((f) => f.restaurants)
    .filter(Boolean) as unknown) as Restaurant[];

  return (
    <main className="mx-auto max-w-5xl">
      <Link href="/profile" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Account
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900">
        Favourites
      </h1>
      <p className="mb-5 mt-1 text-sm text-stone-500">
        Your saved kitchens, ready to reorder.
      </p>

      {restaurants.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-stone-200">
          <p className="text-5xl">🤍</p>
          <h2 className="mt-3 text-lg font-extrabold text-stone-900">No favourites yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">
            Tap “Save” on any restaurant to keep it here for quick reordering.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500"
          >
            Browse restaurants
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </main>
  );
}

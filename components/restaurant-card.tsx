import Link from "next/link";
import type { Restaurant } from "@/types";
import { formatPrice } from "@/types";

// Cover + emoji themed by cuisine so every card feels distinct.
const CUISINE_THEMES: Array<[RegExp, string, string]> = [
  [/biryani|desi|karahi/i, "🍛", "from-amber-400 via-orange-500 to-red-600"],
  [/bbq|grill|kabab|tikka/i, "🍢", "from-rose-500 via-red-600 to-stone-800"],
  [/burger|fast/i, "🍔", "from-violet-500 via-purple-600 to-fuchsia-700"],
  [/pizza/i, "🍕", "from-orange-400 via-red-500 to-rose-600"],
  [/chinese|noodle/i, "🍜", "from-sky-400 via-blue-500 to-indigo-600"],
  [/dessert|sweet|bakery/i, "🍰", "from-pink-400 via-rose-500 to-fuchsia-600"],
  [/chai|tea|drink/i, "🍵", "from-lime-500 via-emerald-600 to-teal-700"],
];

function themeFor(cuisines: string[]): { emoji: string; cover: string } {
  for (const c of cuisines) {
    const hit = CUISINE_THEMES.find(([re]) => re.test(c));
    if (hit) return { emoji: hit[1], cover: hit[2] };
  }
  return { emoji: "🍽️", cover: "from-emerald-500 via-emerald-600 to-teal-700" };
}

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const closed = !restaurant.is_open;
  const theme = themeFor(restaurant.cuisine_types);

  return (
    <Link
      href={`/restaurant/${restaurant.id}`}
      className={`group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200/80 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-900/10 hover:ring-emerald-200 active:scale-[0.98] ${
        closed ? "saturate-50" : ""
      }`}
    >
      <div
        className={`s-pattern relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br ${theme.cover}`}
      >
        {restaurant.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.cover_url}
            alt={restaurant.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <>
            <span className="s-float text-6xl drop-shadow-lg transition-transform duration-500 group-hover:scale-125">
              {theme.emoji}
            </span>
            <span className="absolute -bottom-6 -right-4 select-none text-8xl font-black text-white/10">
              {restaurant.name.split(" ")[0]}
            </span>
          </>
        )}
        {restaurant.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.logo_url}
            alt=""
            className="absolute bottom-3 left-3 h-11 w-11 rounded-xl object-cover shadow-md ring-2 ring-white"
          />
        )}
        {closed ? (
          <span className="absolute left-3 top-3 rounded-full bg-stone-900/85 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            Closed
          </span>
        ) : (
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-emerald-800 backdrop-blur">
            <span className="s-live-dot text-emerald-500" /> Open
          </span>
        )}
        {restaurant.rating_avg != null && (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-extrabold text-stone-800 shadow-sm backdrop-blur">
            ★ {Number(restaurant.rating_avg).toFixed(1)}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold tracking-tight text-stone-900 transition-colors group-hover:text-emerald-700">
          {restaurant.name}
        </h3>
        <p className="mt-0.5 text-sm font-medium text-stone-500">
          {restaurant.cuisine_types.join(" · ")}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-600">
            ⏱ ~{restaurant.default_prep_minutes} min
          </span>
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-600">
            🛵 {formatPrice(restaurant.delivery_fee)}
          </span>
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-600">
            Min {formatPrice(restaurant.min_order)}
          </span>
        </div>
      </div>
    </Link>
  );
}

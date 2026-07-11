"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions/favorites";

export function FavoriteButton({
  restaurantId,
  initial,
}: {
  restaurantId: string;
  initial: boolean;
}) {
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();

  function toggle() {
    // Optimistic flip; revert if the server disagrees.
    const next = !fav;
    setFav(next);
    start(async () => {
      const r = await toggleFavorite(restaurantId);
      if (r.error || typeof r.favorited !== "boolean") setFav(!next);
      else setFav(r.favorited);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={fav}
      aria-label={fav ? "Remove from favourites" : "Save to favourites"}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition-all active:scale-95 ${
        fav
          ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
    >
      <span>{fav ? "❤️" : "🤍"}</span>
      {fav ? "Saved" : "Save"}
    </button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReview } from "@/app/actions/orders";

function Stars({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-neutral-700">{label}</p>
      <div className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={`text-2xl transition ${
              n <= value ? "text-amber-400" : "text-neutral-300 hover:text-amber-200"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewForm({
  orderId,
  hasRider,
}: {
  orderId: string;
  hasRider: boolean;
}) {
  const router = useRouter();
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [riderRating, setRiderRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (restaurantRating === 0) {
      setError("Please rate the food first");
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await submitReview({
        order_id: orderId,
        restaurant_rating: restaurantRating,
        rider_rating: riderRating || null,
        comment: comment.trim() || undefined,
      });
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-6 rounded-xl bg-emerald-50/60 p-4 ring-1 ring-emerald-200">
      <h2 className="font-semibold text-neutral-900">How was it?</h2>
      <div className="mt-3 flex flex-wrap gap-6">
        <Stars
          value={restaurantRating}
          onChange={setRestaurantRating}
          label="Food & restaurant"
        />
        {hasRider && (
          <Stars value={riderRating} onChange={setRiderRating} label="Rider" />
        )}
      </div>
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Anything to add? (optional)"
        maxLength={300}
        className="mt-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <button
        onClick={submit}
        disabled={pending}
        className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit review"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

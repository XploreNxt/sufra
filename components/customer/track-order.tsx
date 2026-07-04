"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  riderId: string;
  initialLat: number | null;
  initialLng: number | null;
  dropLat: number | null;
  dropLng: number | null;
}

/**
 * Live rider position on an OpenStreetMap embed (no map library needed —
 * keeps the bundle light for low-end phones). Subscribes to the rider's
 * row; the marker follows their GPS updates.
 */
export function TrackOrderMap({
  riderId,
  initialLat,
  initialLng,
  dropLat,
  dropLng,
}: Props) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(
    initialLat != null && initialLng != null
      ? { lat: initialLat, lng: initialLng }
      : null
  );

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`rider-${riderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "riders",
          filter: `id=eq.${riderId}`,
        },
        (payload) => {
          const next = payload.new as {
            current_lat: number | null;
            current_lng: number | null;
          };
          if (next.current_lat != null && next.current_lng != null) {
            setPos({ lat: next.current_lat, lng: next.current_lng });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [riderId]);

  // Prefer live rider position; fall back to the delivery pin.
  const center = pos ?? (dropLat != null && dropLng != null
    ? { lat: dropLat, lng: dropLng }
    : null);

  if (!center) {
    return (
      <p className="mt-2 rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-500">
        Live location isn&apos;t available yet — your rider is on the job.
      </p>
    );
  }

  const d = 0.008;
  const bbox = [
    center.lng - d,
    center.lat - d,
    center.lng + d,
    center.lat + d,
  ].join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${center.lat},${center.lng}`;

  return (
    <div className="mt-2 overflow-hidden rounded-xl ring-1 ring-neutral-200">
      <iframe
        key={src}
        src={src}
        className="h-64 w-full border-0"
        loading="lazy"
        title="Rider location"
      />
      <p className="bg-white px-4 py-2 text-xs text-neutral-500">
        {pos
          ? "Marker shows your rider's live location."
          : "Marker shows your delivery address — rider location appears once they share it."}
      </p>
    </div>
  );
}

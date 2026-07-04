"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * While a delivery is active, pushes the rider's GPS position to
 * riders.current_lat/lng every ~10s so the customer's tracking map moves.
 * Silently does nothing if location permission is denied.
 */
export function LocationTracker() {
  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const supabase = createClient();
    let lastSent = 0;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastSent < 10_000) return;
        lastSent = now;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from("riders")
          .update({
            current_lat: pos.coords.latitude,
            current_lng: pos.coords.longitude,
          })
          .eq("user_id", user.id);
      },
      () => {
        /* permission denied — tracking map just won't move */
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return null;
}

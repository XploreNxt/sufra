"use server";

import { cookies } from "next/headers";
import { LOCATION_COOKIE, type CustomerLocation } from "@/lib/geo";

const SIX_MONTHS = 60 * 60 * 24 * 180;

/** Persist the customer's chosen delivery location (read by the home feed). */
export async function setCustomerLocation(
  loc: CustomerLocation
): Promise<{ error?: string }> {
  if (
    !Number.isFinite(loc.lat) ||
    !Number.isFinite(loc.lng) ||
    loc.lat < -90 ||
    loc.lat > 90 ||
    loc.lng < -180 ||
    loc.lng > 180
  ) {
    return { error: "Invalid location" };
  }
  const value = encodeURIComponent(
    JSON.stringify({
      lat: loc.lat,
      lng: loc.lng,
      label: String(loc.label ?? "").slice(0, 120),
    })
  );
  const store = await cookies();
  store.set(LOCATION_COOKIE, value, {
    maxAge: SIX_MONTHS,
    path: "/",
    sameSite: "lax",
  });
  return {};
}

/** Forget the customer's location — the feed will re-prompt. */
export async function clearCustomerLocation(): Promise<void> {
  const store = await cookies();
  store.delete(LOCATION_COOKIE);
}

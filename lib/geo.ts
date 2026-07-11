/** Great-circle (haversine) distance in kilometres between two points. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Delivery fee = Rs 50 base + Rs 20 per km. Mirrors the SQL in place_order. */
export const DELIVERY_BASE_FEE = 50;
export const DELIVERY_PER_KM = 20;
export function deliveryFeeForKm(km: number): number {
  return DELIVERY_BASE_FEE + Math.round(DELIVERY_PER_KM * Math.max(0, km));
}

/** Trim a long geocoded address to its most specific 1–2 parts. */
export function shortLabel(label: string): string {
  const parts = (label ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return "your pin";
  return parts.slice(0, 2).join(", ");
}

/** "1.2 km" / "850 m" — human-friendly distance label. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export interface CustomerLocation {
  lat: number;
  lng: number;
  label: string;
}

export const LOCATION_COOKIE = "sufra_loc";

/** Parse the location cookie value. Returns null if missing/invalid. */
export function parseLocationCookie(
  raw: string | undefined
): CustomerLocation | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(decodeURIComponent(raw));
    if (
      typeof v?.lat === "number" &&
      typeof v?.lng === "number" &&
      Number.isFinite(v.lat) &&
      Number.isFinite(v.lng)
    ) {
      return { lat: v.lat, lng: v.lng, label: String(v.label ?? "") };
    }
  } catch {
    /* fall through */
  }
  return null;
}

/** Default map centre when we have no fix yet — central Karachi. */
export const DEFAULT_CENTER = { lat: 24.8607, lng: 67.0011 };

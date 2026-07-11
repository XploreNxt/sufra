"use server";

export interface PlaceHit {
  lat: number;
  lng: number;
  label: string;
}

/**
 * Place search via Nominatim, proxied server-side. The public /search
 * endpoint doesn't send CORS headers, so a direct browser fetch is blocked
 * — running it here avoids that and lets us send a proper User-Agent.
 */
export async function searchPlaces(
  query: string
): Promise<{ hits?: PlaceHit[]; error?: string }> {
  const q = query.trim();
  if (!q) return { hits: [] };
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=pk&limit=5&q=${encodeURIComponent(
        q
      )}`,
      {
        headers: {
          "User-Agent": "Sufra/1.0 (food delivery app)",
          "Accept-Language": "en",
        },
      }
    );
    if (!res.ok) return { error: "Search failed" };
    const raw = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    return {
      hits: raw.map((h) => ({
        lat: Number(h.lat),
        lng: Number(h.lon),
        label: h.display_name,
      })),
    };
  } catch {
    return { error: "Search failed" };
  }
}

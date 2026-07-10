// Shared date/time helpers. Pakistan time (UTC+5, no DST) so display and
// range math are consistent regardless of where the server runs.

const TZ = "Asia/Karachi";
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

function parts(d: Date, opts: Intl.DateTimeFormatOptions) {
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) map[p.type] = p.value;
  return map;
}

/** "10-July-2026, 1:05 PM" */
export function formatDateTime(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const p = parts(d, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${p.day}-${p.month}-${p.year}, ${p.hour}:${p.minute} ${(p.dayPeriod ?? "").toUpperCase()}`;
}

/** "10-July-2026" */
export function formatDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const p = parts(d, { day: "2-digit", month: "long", year: "numeric" });
  return `${p.day}-${p.month}-${p.year}`;
}

export type RangeKey = "all" | "today" | "7d" | "30d" | "custom";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface SearchParamsShape {
  range?: string;
  from?: string;
  to?: string;
}

/** Turn ?range / ?from / ?to search params into a concrete date window. */
export function resolveRange(sp: SearchParamsShape): {
  key: RangeKey;
  range: DateRange;
} {
  const raw = sp.range ?? "all";
  const key = (["today", "7d", "30d", "custom"].includes(raw) ? raw : "all") as RangeKey;
  const now = Date.now();

  if (key === "today") {
    const pk = new Date(now + PKT_OFFSET_MS); // now in PK wall-clock as UTC fields
    const start = new Date(
      Date.UTC(pk.getUTCFullYear(), pk.getUTCMonth(), pk.getUTCDate()) -
        PKT_OFFSET_MS
    );
    return { key, range: { from: start, to: null } };
  }
  if (key === "7d") {
    return { key, range: { from: new Date(now - 7 * 86400000), to: null } };
  }
  if (key === "30d") {
    return { key, range: { from: new Date(now - 30 * 86400000), to: null } };
  }
  if (key === "custom") {
    const from = sp.from ? new Date(`${sp.from}T00:00:00+05:00`) : null;
    const to = sp.to ? new Date(`${sp.to}T23:59:59+05:00`) : null;
    return {
      key,
      range: {
        from: from && !isNaN(from.getTime()) ? from : null,
        to: to && !isNaN(to.getTime()) ? to : null,
      },
    };
  }
  return { key: "all", range: { from: null, to: null } };
}

/** True if a timestamp falls inside the window (used for in-memory filtering). */
export function inRange(iso: string | null, range: DateRange): boolean {
  if (!iso) return range.from === null && range.to === null;
  const t = new Date(iso).getTime();
  if (range.from && t < range.from.getTime()) return false;
  if (range.to && t > range.to.getTime()) return false;
  return true;
}

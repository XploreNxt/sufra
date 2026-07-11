import type { RestaurantHours } from "@/types";

// All vendors operate in Pakistan (Asia/Karachi, UTC+5, no DST).
const TZ = "Asia/Karachi";
const ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_NAME: Record<string, string> = {
  sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday",
  thu: "Thursday", fri: "Friday", sat: "Saturday",
};

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function addDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** Current wall-clock in Pakistan, regardless of where the code runs. */
function pkNow(): { dateStr: string; minutes: number; dayIndex: number } {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
  });
  const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
  let hour = Number(p.hour);
  if (hour === 24) hour = 0;
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { dateStr: `${p.year}-${p.month}-${p.day}`, minutes: hour * 60 + Number(p.minute), dayIndex };
}

/** "11:00 PM" from "23:00". */
export function fmt12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}

/** Is the Pakistan wall-clock currently inside today's open→close window? */
export function isWithinBusinessHours(hours: RestaurantHours | null): boolean {
  if (!hours) return false;
  const { minutes, dayIndex } = pkNow();
  const d = hours[ORDER[dayIndex]];
  if (!d || d.closed || !d.open || !d.close) return false;
  const o = toMin(d.open), c = toMin(d.close);
  return c > o ? minutes >= o && minutes < c : minutes >= o || minutes < c;
}

/** Today's close time as a UTC ISO string — the shop's auto-close moment. */
export function todayCloseUtcISO(hours: RestaurantHours | null): string | null {
  if (!hours) return null;
  const { dateStr, minutes, dayIndex } = pkNow();
  const d = hours[ORDER[dayIndex]];
  if (!d || d.closed || !d.close) return null;
  const o = toMin(d.open ?? "00:00"), c = toMin(d.close);
  // Overnight close (e.g. 20:00–02:00): close is tomorrow if we're still in the evening part.
  const closeDate = c <= o && minutes >= o ? addDay(dateStr) : dateStr;
  return new Date(`${closeDate}T${d.close}:00+05:00`).toISOString();
}

/** "Opens tomorrow at 11:00 AM" — the next time the shop opens, or null. */
export function nextOpeningLabel(hours: RestaurantHours | null): string | null {
  if (!hours) return null;
  const { minutes, dayIndex } = pkNow();
  for (let i = 0; i < 7; i++) {
    const key = ORDER[(dayIndex + i) % 7];
    const d = hours[key];
    if (!d || d.closed || !d.open) continue;
    if (i === 0 && minutes >= toMin(d.open)) continue; // today's opening already passed
    const when = i === 0 ? "today" : i === 1 ? "tomorrow" : DAY_NAME[key];
    return `Opens ${when} at ${fmt12(d.open)}`;
  }
  return null;
}

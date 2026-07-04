/**
 * Roman-Urdu-tolerant search normalization.
 * Pakistani users spell the same word many ways ("biryani", "biriyani",
 * "briyani"; "chargha", "charga"). Normalizing both the query and the
 * target makes those variants match without a search engine:
 *  - lowercase, strip non-letters
 *  - common digraph folding (kh→k, gh→g, ph→f, zz→z …)
 *  - drop vowels except a leading one, collapse repeats
 * "biriyani" → "brn", "biryani" → "brn", "chargha" → "carga"-ish → equal.
 */
export function normalizeRomanUrdu(input: string): string {
  let s = input.toLowerCase().replace(/[^a-z]/g, "");
  if (!s) return "";

  s = s
    .replace(/kh/g, "k")
    .replace(/gh/g, "g")
    .replace(/ph/g, "f")
    .replace(/sh/g, "s")
    .replace(/ch/g, "c")
    .replace(/th/g, "t")
    .replace(/zz/g, "z")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u");

  // keep first char as-is, drop vowels from the rest
  const head = s[0];
  const tail = s.slice(1).replace(/[aeiouy]/g, "");
  s = head + tail;

  // collapse repeated letters ("cheezzy" → "chzy")
  return s.replace(/(.)\1+/g, "$1");
}

/** True when the query loosely matches the target (Roman-Urdu tolerant). */
export function romanUrduMatch(query: string, target: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const t = target.toLowerCase();
  if (t.includes(q)) return true;

  const nq = normalizeRomanUrdu(q);
  if (!nq) return false;
  // match against each word plus the whole string
  const words = [...t.split(/\s+/), t.replace(/\s+/g, "")];
  return words.some((w) => normalizeRomanUrdu(w).includes(nq));
}

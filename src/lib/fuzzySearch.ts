/**
 * Word-based fuzzy search. Each word in the query must match
 * somewhere in the target text. Order doesn't matter.
 * "blue hill" matches "Blue Hills Reservation"
 * "kingdom vt" matches "Kingdom Trails" (region: Southern VT)
 */
export function fuzzyMatch(query: string, ...targets: string[]): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const combined = targets.join(' ').toLowerCase();
  return words.every((word) => combined.includes(word));
}

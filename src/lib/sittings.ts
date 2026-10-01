// Shared "sitting" heuristic — used to group a table's orders into
// separate parties/seatings both on the admin Live Orders Board and the
// customer-facing running-total display (see getTableRunningTotal in
// lib/data/orders.ts). The schema has no formal checkout/session concept:
// a `table_id` is a fixed physical table reused by unrelated parties over
// days/weeks, so "this table's orders" alone isn't the same as "this
// table's current sitting". A gap this long between consecutive orders at
// the same table is treated as a reliable-enough signal the table turned
// over. This is a best-effort heuristic, not a guarantee.
export const SITTING_GAP_MS = 90 * 60 * 1000;

/**
 * Splits a same-table list of items into separate sittings wherever the
 * gap between consecutive timestamps exceeds SITTING_GAP_MS. Input order
 * doesn't matter (it's sorted internally); output groups are in
 * chronological order, oldest sitting first, each internally oldest-first.
 */
export function groupIntoSittings<T>(items: T[], getTime: (item: T) => number): T[][] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => getTime(a) - getTime(b));
  const sittings: T[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const gap = getTime(sorted[i]) - getTime(sorted[i - 1]);
    if (gap > SITTING_GAP_MS) sittings.push([]);
    sittings[sittings.length - 1].push(sorted[i]);
  }
  return sittings;
}

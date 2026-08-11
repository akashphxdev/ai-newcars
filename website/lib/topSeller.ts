// lib/topSeller.ts
//
// Which single trim wears the "Top seller" badge.
//
// The catalogue flags more than one variant per model as a top seller —
// a dozen models carry two — and a badge that appears twice stops meaning
// "this is the one" and starts reading as a bug. The flag is honest data
// we cannot edit here, so the display picks one: the cheapest flagged
// trim, since that is the one the ordering already puts first and the one
// a "best seller" claim usually refers to.
//
// Returns null when nothing is flagged, so callers can badge nothing
// rather than crowning an arbitrary row.

export function topSellerId<T extends { id: number; isTopSeller?: boolean; price: string }>(
  variants: T[],
): number | null {
  const flagged = variants.filter((v) => v.isTopSeller);
  if (flagged.length === 0) return null;
  return flagged.reduce((cheapest, v) => (Number(v.price) < Number(cheapest.price) ? v : cheapest)).id;
}

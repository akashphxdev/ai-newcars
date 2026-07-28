// features/compare/comparePendingSelection.ts
//
// sessionStorage handoff between ComparePicker (Brand -> Model -> Variant
// -> Powertrain) and the comparison result page's CompareResults — the
// URL never carries variant/powertrain ids (clean "/compare/a-vs-b" like
// CarDekho, not "?v0=..&p0=.."), so the picker's exact choice is passed
// through here instead, applied once client-side right after landing.

const KEY = "compare_pending_selection";

export type PendingCompareSelection = {
  slugPath: string;
  // undefined at a position means "use that car's default variant/powertrain"
  // (e.g. a car with no seeded variants at all).
  variantIds: (number | undefined)[];
  powertrainIds: (number | undefined)[];
};

export function savePendingCompareSelection(selection: PendingCompareSelection) {
  sessionStorage.setItem(KEY, JSON.stringify(selection));
}

// Reads and clears in one step — a pending selection is meant to be
// consumed exactly once, right after the navigation that set it.
export function takePendingCompareSelection(): PendingCompareSelection | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  sessionStorage.removeItem(KEY);
  try {
    return JSON.parse(raw) as PendingCompareSelection;
  } catch {
    return null;
  }
}

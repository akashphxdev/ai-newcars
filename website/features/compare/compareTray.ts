// features/compare/compareTray.ts
//
// localStorage-backed "comparison tray" — lets a visitor queue up variants
// from anywhere on the site (starting with the model page's Variants list)
// before deciding to compare, instead of the "Add to Compare" button
// jumping straight to a comparison. Same localStorage-persistence idea as
// recentComparisons.ts, but this one is actively read/written across
// different pages in the same session, so every mutation also dispatches
// a same-tab custom event — the native "storage" event only fires in
// OTHER tabs, and CompareTray (mounted once, in the root layout) needs to
// react immediately when e.g. VariantsList adds an item on the same page.

export const MAX_TRAY_ITEMS = 4;

const KEY = "compare_tray";
const EVENT = "compare-tray-change";

export interface CompareTrayItem {
  modelSlug: string;
  variantId: number;
  variantName: string;
  carName: string;
  brandName: string;
  imageUrl: string | null;
}

function read(): CompareTrayItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CompareTrayItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CompareTrayItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getTrayItems(): CompareTrayItem[] {
  return read();
}

// Multiple variants of the SAME model can be queued (e.g. two trims of
// one car vs. a rival) — the backend resolves each queued slot by its own
// variantId independently, so there's no data-layer reason to forbid it.
// variantId (not modelSlug) is what makes an entry unique here.
export function addToTray(item: CompareTrayItem): CompareTrayItem[] {
  const items = read();
  if (items.some((i) => i.variantId === item.variantId) || items.length >= MAX_TRAY_ITEMS) {
    return items;
  }
  const next = [...items, item];
  write(next);
  return next;
}

export function removeFromTray(variantId: number): CompareTrayItem[] {
  const next = read().filter((i) => i.variantId !== variantId);
  write(next);
  return next;
}

export function clearTray() {
  write([]);
}

export function subscribeTray(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

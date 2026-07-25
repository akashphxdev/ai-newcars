"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { RECENT_COMPARISONS_KEY, type RecentComparison } from "./recentComparisons";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='10' fill='%23e5e7eb'/%3E%3C/svg%3E";

// Client-only: localStorage isn't available during SSR, so this starts
// empty (matching the server-rendered markup) and fills in after mount —
// no hydration mismatch, just a brief empty state on first paint.
export default function RecentlyViewedComparisons() {
  const [items, setItems] = useState<RecentComparison[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_COMPARISONS_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore — falls back to the empty state below
    }
  }, []);

  const clear = () => {
    localStorage.removeItem(RECENT_COMPARISONS_KEY);
    setItems([]);
  };

  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-ink">Continue Comparing</h2>
        <button type="button" onClick={clear} className="cursor-pointer text-[12px] font-semibold text-muted hover:text-brand">
          Clear
        </button>
      </div>

      <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
        {items.map((item) => (
          <a
            key={item.comparisonSlug}
            href={`/compare/${item.comparisonSlug}`}
            className="flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-surface p-2.5 pr-4 transition-colors hover:border-brand"
          >
            <div className="flex -space-x-3">
              {item.cars.map((car) => (
                <div key={car.id} className="relative size-11 overflow-hidden rounded-full border-2 border-page bg-page">
                  <Image src={car.coverImageUrl ?? FALLBACK_IMG} alt={car.name} fill sizes="44px" className="object-cover" />
                </div>
              ))}
            </div>
            <span className="whitespace-nowrap text-[12.5px] font-bold text-ink">
              {item.cars.map((c) => c.name).join(" vs ")}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

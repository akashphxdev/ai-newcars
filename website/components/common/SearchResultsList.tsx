// components/common/SearchResultsList.tsx
//
// The car-search typeahead dropdown. Lived inside Header until the hero
// grew its own search box; it is the same list in both places, so it
// belongs here rather than being copied.

import type { SearchCarResult } from "@/features/search/search.types";

export default function SearchResultsList({
  results,
  searching,
  onSelect,
}: {
  results: SearchCarResult[];
  searching: boolean;
  onSelect: (car: SearchCarResult) => void;
}) {
  if (!searching && results.length === 0) return null;

  return (
    <div
      // Prevents the input from blurring before a result's click fires —
      // without this, onBlur closes the dropdown first and the click
      // never lands (classic blur-vs-click race).
      onMouseDown={(e) => e.preventDefault()}
      className="absolute left-0 top-full z-50 mt-1.5 max-h-96 w-full min-w-70 overflow-y-auto rounded-xl border border-border bg-surface py-1.5 shadow-lg"
    >
      {searching && results.length === 0 && (
        <p className="px-3.5 py-3 text-[12.5px] font-medium text-muted">Searching...</p>
      )}
      {results.map((car) => (
        <button
          key={car.id}
          type="button"
          onClick={() => onSelect(car)}
          className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left transition-colors hover:bg-page"
        >
          <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-page">
            {car.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- tiny result thumb, not worth next/image's overhead here
              <img src={car.coverImageUrl} alt={car.name} className="size-full object-cover" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[10.5px] font-semibold uppercase tracking-wide text-muted">
              {car.brand.name}
            </span>
            <span className="block truncate text-[13px] font-bold text-ink">{car.name}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

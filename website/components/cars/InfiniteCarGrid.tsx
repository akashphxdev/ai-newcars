"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCarsBrowse, type BrowseCarsFilters } from "@/features/cars/car.api";
import { getBrandCars, type BrandCarsFilters } from "@/features/brands/brand.api";
import { getBodyTypeCars, type BodyTypeCarsFilters } from "@/features/bodyTypes/bodyType.api";
import BrandCarCard from "@/components/brands/BrandCarCard";
import UpcomingCarCard from "@/components/cars/UpcomingCarCard";
import type { HomeCar } from "@/features/cars/car.types";
import type { Pagination } from "@/lib/apiClient";

const DEFAULT_GRID_CLASS = "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3";

// Functions can't cross the Server -> Client Component boundary as props
// (a page.tsx passing a `renderCard` closure straight to this "use client"
// component fails at runtime) — so the card design is picked here, from a
// plain serializable string, instead of being passed in as a function.
type CardType = "standard" | "upcoming";

function renderCard(car: HomeCar, cardType: CardType) {
  return cardType === "upcoming" ? <UpcomingCarCard key={car.id} car={car} /> : <BrandCarCard key={car.id} car={car} />;
}

// The un-scoped browse endpoint and the brand-/body-type-scoped ones all
// take near-identical filter shapes and return the same {cars, pagination}
// shape — this lets one grid component drive all three instead of a
// near-duplicate per source.
type CarSource =
  | { kind: "browse"; filters: Omit<BrowseCarsFilters, "page"> }
  | { kind: "brand"; slug: string; filters: Omit<BrandCarsFilters, "page"> }
  | { kind: "bodyType"; slug: string; filters: Omit<BodyTypeCarsFilters, "page"> };

async function fetchPage(source: CarSource, page: number): Promise<{ cars: HomeCar[]; pagination: Pagination } | null> {
  if (source.kind === "browse") {
    return getCarsBrowse({ ...source.filters, page });
  }
  if (source.kind === "brand") {
    const result = await getBrandCars(source.slug, { ...source.filters, page });
    return result ? { cars: result.cars, pagination: result.pagination } : null;
  }
  const result = await getBodyTypeCars(source.slug, { ...source.filters, page });
  return result ? { cars: result.cars, pagination: result.pagination } : null;
}

// Replaces click-through Previous/Next pagination — scrolling near the
// bottom auto-loads the next page and appends it, same data source the
// server already used for the first page. cardType picks between the two
// card designs in use (UpcomingCarCard's countdown vs BrandCarCard's
// price/CTAs) since different browse pages want different ones.
//
// The parent page is expected to pass a `key` that changes whenever the
// filters/sort change (e.g. the query string) — that remounts this
// component with a fresh initialCars/initialPagination instead of this
// component having to reconcile a filter change via an effect.
export default function InfiniteCarGrid({
  initialCars,
  initialPagination,
  source,
  cardType = "standard",
  gridClassName = DEFAULT_GRID_CLASS,
}: {
  initialCars: HomeCar[];
  initialPagination: Pagination;
  // Same filters (and, for brand/bodyType, the same slug) the page's own
  // server-side call used — reused here to fetch page 2, 3, ... on scroll.
  source: CarSource;
  cardType?: CardType;
  gridClassName?: string;
}) {
  const [cars, setCars] = useState(initialCars);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = pagination.page < pagination.totalPages;

  const loadNext = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const next = await fetchPage(source, pagination.page + 1);
      if (!next) return;
      setCars((prev) => [...prev, ...next.cars]);
      setPagination(next.pagination);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, pagination.page, source]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadNext();
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadNext]);

  if (cars.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">
        No cars match these filters — try adjusting them.
      </p>
    );
  }

  return (
    <>
      <div className={gridClassName}>{cars.map((car) => renderCard(car, cardType))}</div>

      {hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-10">
          <span className="text-[13px] font-semibold text-muted">{loading ? "Loading more cars…" : ""}</span>
        </div>
      )}
    </>
  );
}

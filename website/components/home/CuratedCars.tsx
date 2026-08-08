// components/home/CuratedCars.tsx
//
// One tabbed, filterable showcase in place of the three near-identical
// homepage rails. The first tab is rendered on the server; later tabs are
// fetched once and cached in memory so returning to them is instant.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import CarCard from "@/components/cars/CarCard";
import FeaturedCarCard from "@/components/cars/FeaturedCarCard";
import { ChevronDownIcon, ChevronIcon, FuelIcon, GaugeIcon } from "@/components/common/icons";
import { getHomeCars } from "@/features/cars/car.api";
import type { HomeCar } from "@/features/cars/car.types";
import { routes } from "@/lib/routes";

const TABS = [
  { key: "latest", label: "New Launches" },
  { key: "popular", label: "Popular" },
  { key: "luxury", label: "Luxury" },
  { key: "electric", label: "EV" },
] as const;

type TabKey = (typeof TABS)[number]["key"];
type FuelFilter = "all" | "electric" | "combustion";
type SortKey = "latest" | "price-asc" | "price-desc" | "rating";

function FilterSelect({
  label,
  value,
  onChange,
  icon,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="relative flex min-h-10 min-w-[136px] items-center rounded-[6px] border border-border bg-surface transition-colors hover:border-faint focus-within:border-brand focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand/20">
      <span className="pointer-events-none absolute left-3.5 text-ink">{icon}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full w-full cursor-pointer appearance-none bg-transparent py-2 pl-9 pr-8 text-[12px] font-semibold text-ink outline-none"
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 size-3.5 text-muted" />
    </label>
  );
}

function CuratedSkeleton() {
  return (
    <div className="grid min-h-[430px] animate-pulse gap-3.5 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="rounded-[8px] bg-border/70" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[8px] bg-border/70" />
        <div className="rounded-[8px] bg-border/70" />
        <div className="min-h-44 rounded-[8px] bg-border/70 sm:col-span-2" />
      </div>
    </div>
  );
}

export default function CuratedCars({
  initialCars,
  initialTab = "latest",
}: {
  initialCars: HomeCar[];
  initialTab?: TabKey;
}) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [loading, setLoading] = useState(false);
  const cache = useRef<Partial<Record<TabKey, HomeCar[]>>>({ [initialTab]: initialCars });
  const [cars, setCars] = useState<HomeCar[]>(initialCars);
  const [bodyFilter, setBodyFilter] = useState("all");
  const [fuelFilter, setFuelFilter] = useState<FuelFilter>("all");
  const [sort, setSort] = useState<SortKey>("latest");

  const select = useCallback((next: TabKey) => {
    setTab(next);
    setBodyFilter("all");
    setFuelFilter("all");
    const cached = cache.current[next];
    if (cached) {
      setCars(cached);
      return;
    }
    setLoading(true);
  }, []);

  useEffect(() => {
    if (!loading) return;
    let alive = true;
    getHomeCars(tab, 4)
      .then((res) => {
        if (!alive) return;
        cache.current[tab] = res;
        setCars(res);
      })
      .catch(() => {
        if (alive) setCars([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [loading, tab]);

  const bodyTypes = useMemo(
    () => Array.from(new Set(cars.flatMap((car) => (car.bodyType ? [car.bodyType.name] : [])))),
    [cars],
  );

  const visibleCars = useMemo(() => {
    const filtered = cars.filter((car) => {
      if (bodyFilter !== "all" && car.bodyType?.name !== bodyFilter) return false;
      if (fuelFilter === "electric" && !car.isElectric) return false;
      if (fuelFilter === "combustion" && car.isElectric) return false;
      return true;
    });

    if (sort === "latest") return filtered;
    return [...filtered].sort((a, b) => {
      if (sort === "rating") return Number(b.ratingAvg ?? 0) - Number(a.ratingAvg ?? 0);
      const aPrice = Number(a.priceMin ?? Number.MAX_SAFE_INTEGER);
      const bPrice = Number(b.priceMin ?? Number.MAX_SAFE_INTEGER);
      return sort === "price-asc" ? aPrice - bPrice : bPrice - aPrice;
    });
  }, [bodyFilter, cars, fuelFilter, sort]);

  const [featured, ...rest] = visibleCars;

  return (
    <section className="relative overflow-hidden bg-page py-12 sm:py-14 lg:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(242,101,15,0.04),transparent_28%)]"
      />

      <div className="relative mx-auto max-w-[1536px] px-5 sm:px-8 xl:px-10 2xl:px-0">
        <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)] lg:items-end xl:grid-cols-[370px_minmax(0,1fr)]">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-brand sm:text-[11px]">
              Curated for you
            </p>
            <h2 className="mt-3 max-w-[370px] text-balance font-head text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[36px] xl:text-[40px]">
              Curated cars for every driver
            </h2>
            <p className="mt-3 max-w-[350px] text-pretty text-[13.5px] leading-6 text-muted sm:text-[14.5px]">
              New launches, popular picks, and expert-shortlisted models in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3.5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 overflow-x-auto border-b border-border scrollbar-none" role="tablist" aria-label="Car collections">
              {TABS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.key}
                  onClick={() => select(item.key)}
                  className={`relative min-h-10 shrink-0 cursor-pointer px-4 py-2.5 text-[12.5px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand ${
                    tab === item.key ? "text-brand" : "text-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute inset-x-0 -bottom-px h-0.5 bg-brand transition-transform duration-300 ${
                      tab === item.key ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2.5">
              <FilterSelect
                label="Filter by body type"
                value={bodyFilter}
                onChange={setBodyFilter}
                icon={<GaugeIcon className="size-4" />}
              >
                <option value="all">All body types</option>
                {bodyTypes.map((bodyType) => (
                  <option key={bodyType} value={bodyType}>{bodyType}</option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Filter by fuel type"
                value={fuelFilter}
                onChange={(value) => setFuelFilter(value as FuelFilter)}
                icon={<FuelIcon className="size-4" />}
              >
                <option value="all">All fuel types</option>
                <option value="electric">Electric</option>
                <option value="combustion">Combustion</option>
              </FilterSelect>
              <FilterSelect
                label="Sort cars"
                value={sort}
                onChange={(value) => setSort(value as SortKey)}
                icon={<span aria-hidden className="text-[17px] leading-none">↕</span>}
              >
                <option value="latest">Sort: Latest</option>
                <option value="price-asc">Price: Low to high</option>
                <option value="price-desc">Price: High to low</option>
                <option value="rating">Top rated</option>
              </FilterSelect>
            </div>
          </div>
        </div>

        <div className="mt-8" aria-busy={loading}>
          {loading ? (
            <CuratedSkeleton />
          ) : visibleCars.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-[8px] border border-dashed border-faint bg-surface px-6 text-center">
              <p className="font-head text-xl font-bold text-ink">No cars match these filters</p>
              <p className="mt-2 text-sm text-muted">Try another body or fuel type.</p>
              <button
                type="button"
                onClick={() => {
                  setBodyFilter("all");
                  setFuelFilter("all");
                }}
                className="mt-5 cursor-pointer rounded-[7px] border border-brand px-4 py-2.5 text-[13px] font-bold text-brand transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid items-stretch gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              {featured && <FeaturedCarCard car={featured} />}
              <div className="grid content-start gap-4 sm:grid-cols-2">
                {rest.slice(0, 2).map((car) => (
                  <CarCard key={car.id} car={car} variant="curated" />
                ))}
                {rest[2] && (
                  <div className="sm:col-span-2">
                    <CarCard car={rest[2]} variant="curated-wide" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-7 flex justify-end">
          <Link
            href={routes.newCars()}
            className="inline-flex min-h-12 items-center gap-3 rounded-[7px] bg-brand px-6 py-3 text-[13.5px] font-bold text-white no-underline shadow-[0_14px_30px_-18px_rgba(242,101,15,0.9)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-[0_18px_36px_-20px_rgba(242,101,15,0.95)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-0 active:scale-[0.98]"
          >
            Explore all cars <ChevronIcon className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

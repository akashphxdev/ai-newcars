// components/home/CuratedCars.tsx
//
// One tabbed section in place of the three near-identical rails that ran
// down the homepage (LatestCars, Popularcars, Electriccars). They asked
// the same question of the same endpoint with a different `type`, so a
// visitor scrolled past three headings to see three shuffles of the same
// catalogue. Tabs put the choice in their hands and buy back the height.
//
// The first tab's cars are rendered on the server so the section is
// filled on arrival; switching tabs fetches client-side and caches, so
// going back to a tab already seen is instant.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import SectionHeader from "@/components/common/SectionHeader";
import CarCard from "@/components/cars/CarCard";
import FeaturedCarCard from "@/components/cars/FeaturedCarCard";
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

  const select = useCallback((next: TabKey) => {
    setTab(next);
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

  const [featured, ...rest] = cars;

  return (
    <section className="bg-page py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Curated for you"
          title="Curated cars for every driver"
          subtitle="New launches, popular picks, and expert-shortlisted models in one place."
          after={
            <div className="flex flex-wrap gap-1" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => select(t.key)}
                  className={`cursor-pointer border-b-2 px-3.5 py-2 text-[13px] font-bold transition-colors ${
                    tab === t.key
                      ? "border-brand text-brand"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          }
        />

        {/* Height is held steady while a tab loads so the page below does
            not jump as the cards swap. */}
        <div className={`mt-6 transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}>
          {cars.length === 0 && !loading ? (
            <p className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
              Nothing to show here yet.
            </p>
          ) : (
            <div className="grid items-stretch gap-4 lg:grid-cols-2">
              {featured && <FeaturedCarCard car={featured} />}
              <div className="grid content-start gap-4 sm:grid-cols-2">
                {rest.slice(0, 2).map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
                {rest[2] && (
                  <div className="sm:col-span-2">
                    <CarCard car={rest[2]} variant="wide" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            href={routes.newCars()}
            className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-[13px] font-bold text-white no-underline transition-colors hover:bg-brand-hover"
          >
            Explore all cars <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

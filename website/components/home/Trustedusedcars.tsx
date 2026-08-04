"use client";
import Image from "next/image";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import type { HomeCity } from "@/features/cities/city.types";

const SURFACE = "#f4f5f9";
const BORDER = "#e5e7eb";
// No per-city icon field on the City table — every city falls back to this
// generic building icon unless it has its own logoUrl.
const FALLBACK_ICON = "https://api.iconify.design/mdi:city.svg";

const CityCard = ({ city }: { city: HomeCity }) => (
  <a
    href={`/used-cars/${city.slug}`}
    className="relative flex min-h-[130px] flex-col items-center justify-center gap-2 rounded-2xl bg-white p-3 text-center sm:min-h-[160px] sm:gap-3 sm:p-5"
    style={{ border: "1px solid " + BORDER, boxShadow: "0 1px 2px rgba(17,24,39,0.04)" }}
  >
    <Image src={city.logoUrl ?? FALLBACK_ICON} alt={city.name} width={56} height={56} className="size-10 sm:size-14" />

    <p className="text-sm font-bold text-ink">{city.name}</p>
  </a>
);

// 2 rows, columns scroll together — cities flow into rows column-by-column
// (grid-flow-col + grid-rows-2), so the whole grid is one horizontally
// scrollable unit instead of two separately-scrolling rows.
const ROWS = 2;

export default function TrustedUsedCars({ cities }: { cities: HomeCity[] }) {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows } = useScrollRail<HTMLDivElement>();

  if (cities.length === 0) return null;

  const scrollByColumn = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.children[0] as HTMLElement | undefined;
    const nextColumn = el.children[ROWS] as HTMLElement | undefined; // same row, next column over
    const step = first && nextColumn ? nextColumn.offsetLeft - first.offsetLeft : el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <section className="py-12 sm:py-16" style={{ background: SURFACE }}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Find Nearby"
          title="Get trusted used cars in your city"
          subtitle="Browse verified listings across India's top cities"
          after={
            <ScrollArrows
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onLeft={() => scrollByColumn("left")}
              onRight={() => scrollByColumn("right")}
            />
          }
        />

        {/* Fixed column width — stays this size no matter how many cities
            are added; extras slide in via scroll instead of shrinking
            everyone to re-fit the row. Smaller on mobile, unchanged from
            sm: up. */}
        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="scrollbar-none grid grid-flow-col grid-rows-2 auto-cols-[130px] gap-2 overflow-x-auto pb-2 sm:auto-cols-[236px] sm:gap-4"
        >
          {cities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import { WishlistButton } from "@/components/common/CardBits";
import { ChevronIcon, GaugeIcon, StarIcon } from "@/components/common/icons";
import { formatPriceRange } from "@/lib/format";
import { getHomeCars } from "@/features/cars/car.api";
import type { HomeCar } from "@/features/cars/car.types";

const CARS_PER_BRAND = 6;

const ORANGE = "#f2650f";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const PAGE_BG = "#f4f5f9";
const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='225' viewBox='0 0 300 225'%3E%3Crect width='300' height='225' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

// Distinctive icons kept local since they're visually different from the
// generic common/icons.tsx equivalents (or have no equivalent there).
const EngineIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none">
    <path d="M3 13v3a1 1 0 0 0 1 1h1M3 13V9a1 1 0 0 1 1-1h6l3 3h4a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1h-1M3 13h9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M7 17v2M11 17v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const SeaterIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const Spec = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span style={{ color: "#9aa1ad" }}>{icon}</span>
    <div className="leading-tight">
      <p className="text-[12.5px] font-bold" style={{ color: DARK }}>
        {value}
      </p>
      <p className="text-[10.5px] font-medium" style={{ color: MUTED }}>
        {label}
      </p>
    </div>
  </div>
);

const Card = ({ car }: { car: HomeCar }) => {
  const modelUrl = `/${car.brand.slug}-cars/${car.slug}`;

  return (
    <div
      className="flex h-full w-[290px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: PAGE_BG }}>
        <Link href={modelUrl} className="absolute inset-0 z-0" aria-label={`View ${car.brand.name} ${car.name} details`}>
          <Image src={car.coverImageUrl ?? FALLBACK_IMG} alt={car.name} fill sizes="290px" className="object-cover" />
        </Link>

        {car.bodyType && (
          <div className="absolute left-3 top-3 z-10">
            <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide" style={{ color: DARK }}>
              {car.bodyType.name}
            </span>
          </div>
        )}

        <div className="absolute right-3 top-3 z-10">
          <WishlistButton modelId={car.id} size="md" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em]" style={{ color: MUTED }}>
              {car.brand.name}
            </p>
            <h3 className="text-[16.5px] font-bold leading-tight" style={{ color: DARK }}>
              {car.name}
            </h3>
          </div>
          {car.ratingAvg && (
            <div className="flex shrink-0 items-center gap-1 pt-0.5">
              <StarIcon filled className="size-3 text-amber-400" />
              <span className="text-[12.5px] font-bold" style={{ color: DARK }}>
                {car.ratingAvg}
              </span>
            </div>
          )}
        </div>

        <p className="text-[19px] font-extrabold" style={{ color: DARK }}>
          {formatPriceRange(car.priceMin, car.priceMax)}
        </p>

        <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "#f0f1f4" }}>
          <Spec icon={<EngineIcon />} value={car.specs?.engineCc ? `${car.specs.engineCc} cc` : "-"} label="Engine" />
          <Spec icon={<GaugeIcon className="size-4" />} value={car.specs?.mileage ? `${car.specs.mileage} kmpl` : "-"} label="Mileage" />
          <Spec icon={<SeaterIcon />} value={car.specs?.seatingCapacity ? `${car.specs.seatingCapacity}` : "-"} label="Seater" />
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2.5 px-4 pb-4 pt-3.5">
        <Link
          href={modelUrl}
          className="flex-1 rounded-xl px-4 py-2.5 text-center text-[13px] font-bold"
          style={{ border: `1px solid ${BORDER}`, color: DARK }}
        >
          View Details
        </Link>
        <Link
          href={modelUrl}
          className="flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-center text-[13px] font-bold transition-colors hover:bg-orange-50"
          style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE }}
        >
          Check Price
        </Link>
      </div>
    </div>
  );
};

export default function LatestCars({ cars: initialCars }: { cars: HomeCar[] }) {
  // Deduped from the initial (unscoped) rail — enough to build the chip
  // list without a separate "all brands" lookup call.
  const brands = Array.from(new Map(initialCars.map((c) => [c.brand.slug, c.brand])).values());
  const [activeBrandSlug, setActiveBrandSlug] = useState<string | null>(null);
  // Each brand chip re-fetches ITS OWN latest cars from the API (rather
  // than filtering the fixed initial 6) — otherwise a brand with only 1-2
  // cars in that unscoped set of 6 would show fewer than CARS_PER_BRAND
  // even though the brand actually has more.
  const [visibleCars, setVisibleCars] = useState(initialCars);
  const [loading, setLoading] = useState(false);
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  if (initialCars.length === 0) return null;

  async function selectBrand(slug: string | null) {
    setActiveBrandSlug(slug);
    if (slug === null) {
      setVisibleCars(initialCars);
      return;
    }
    setLoading(true);
    try {
      setVisibleCars(await getHomeCars("latest", CARS_PER_BRAND, slug));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: PAGE_BG }}>
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            title="Latest Cars"
            titleSize="lg"
            underline
            divider
            subtitle="Explore the newest launches in the market. Stay ahead with the latest features, designs, and innovation."
            after={
              <>
                <Link
                  href="/new-cars"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-5 py-3 text-[13.5px] font-bold"
                  style={{ border: `1px solid ${ORANGE}`, color: ORANGE }}
                >
                  View All New Cars
                  <ChevronIcon />
                </Link>
                <ScrollArrows
                  canScrollLeft={canScrollLeft}
                  canScrollRight={canScrollRight}
                  onLeft={() => scrollBy("left")}
                  onRight={() => scrollBy("right")}
                />
              </>
            }
          />

          <div className="scrollbar-none mb-7 flex flex-nowrap items-center gap-2.5 overflow-x-auto sm:flex-wrap">
            <button
              type="button"
              onClick={() => selectBrand(null)}
              disabled={loading}
              className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed"
              style={{
                background: "#fff",
                color: activeBrandSlug === null ? ORANGE : DARK,
                border: `1.5px solid ${activeBrandSlug === null ? ORANGE : BORDER}`,
              }}
            >
              All Brands
            </button>
            {brands.map((brand) => {
              const active = brand.slug === activeBrandSlug;
              return (
                <button
                  key={brand.slug}
                  type="button"
                  onClick={() => selectBrand(brand.slug)}
                  disabled={loading}
                  className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed"
                  style={{
                    background: "#fff",
                    color: active ? ORANGE : DARK,
                    border: `1.5px solid ${active ? ORANGE : BORDER}`,
                  }}
                >
                  {brand.name}
                </button>
              );
            })}
          </div>

          {loading ? (
            <p className="py-8 text-center text-[13px] font-medium" style={{ color: MUTED }}>
              Loading cars…
            </p>
          ) : (
            <div
              ref={trackRef}
              onScroll={updateArrows}
              className="scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
            >
              {visibleCars.map((car) => (
                <Card key={car.id} car={car} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

"use client";
import { useEffect } from "react";
import Image from "next/image";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import { formatSinglePrice } from "@/lib/format";
import type { RandomComparisonPair, RandomPairCar } from "@/features/compare/compare.types";

const ORANGE = "#f2650f";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const SURFACE = "#f4f5f9";
const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='225' viewBox='0 0 300 225'%3E%3Crect width='300' height='225' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const CarSideBlock = ({ car }: { car: RandomPairCar }) => (
  <div className="flex-1 min-w-0">
    <p className="truncate text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
      {car.brand.name}
    </p>
    <p className="truncate text-[13.5px] font-bold" style={{ color: DARK }}>
      {car.name}
    </p>
    <p className="mt-0.5 text-[12px] font-bold" style={{ color: DARK }}>
      {formatSinglePrice(car.priceMin)}
      <span className="ml-0.5 align-top text-[9px]" style={{ color: MUTED }}>
        *
      </span>
    </p>
  </div>
);

const CarImage = ({ car }: { car: RandomPairCar }) => (
  <Image
    src={car.coverImageUrl ?? FALLBACK_IMG}
    alt={`${car.brand.name} ${car.name}`}
    fill
    sizes="150px"
    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
  />
);

const Card = ({ pair }: { pair: RandomComparisonPair }) => (
  <article
    className="group flex h-full w-75 shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1 motion-reduce:hover:translate-y-0"
    style={{ border: "1px solid " + BORDER, boxShadow: "0 1px 2px rgba(17,24,39,0.04)" }}
    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 14px 30px rgba(17,24,39,0.12)")}
    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 2px rgba(17,24,39,0.04)")}
  >
    <div className="relative flex" style={{ background: SURFACE }}>
      <div className="relative aspect-4/3 w-1/2 overflow-hidden">
        <CarImage car={pair.carA} />
      </div>
      <div className="relative aspect-4/3 w-1/2 overflow-hidden">
        <CarImage car={pair.carB} />
      </div>

      <span
        className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11.5px] font-extrabold"
        style={{ color: ORANGE, border: "1px solid " + ORANGE, background: "#f3f4f6" }}
      >
        VS
      </span>
    </div>

    <div className="flex items-start gap-3 px-4 pt-4">
      <CarSideBlock car={pair.carA} />
      <div className="mt-1 h-10 w-px shrink-0" style={{ background: "#f0f1f4" }} />
      <CarSideBlock car={pair.carB} />
    </div>

    <div className="mt-auto px-4 pb-4 pt-3.5">
      <a
        href={`/compare/${pair.carA.slug}-vs-${pair.carB.slug}`}
        className="flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl py-2.5 text-[12.5px] font-bold transition-colors hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE, outlineColor: ORANGE }}
      >
        {pair.carA.name} vs {pair.carB.name}
      </a>
    </div>
  </article>
);

export default function CompareCars({ pairs }: { pairs: RandomComparisonPair[] }) {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  // Compare cards' widths don't change with viewport, but the number of
  // visible cards does — re-check arrow state on resize, not just on mount.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    window.addEventListener("resize", updateArrows);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateArrows);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackRef]);

  if (pairs.length === 0) return null;

  return (
    <section className="font-body py-12 sm:py-16" style={{ background: SURFACE }}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Decide Faster"
          title="Compare to buy the right car"
          href="/compare-cars"
          linkLabel="View all comparisons"
          after={
            <ScrollArrows
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onLeft={() => scrollBy("left")}
              onRight={() => scrollBy("right")}
            />
          }
        />

        <div className="relative">
          {/* edge fades hint that the row scrolls, especially useful on mobile where arrows are hidden */}
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 transition-opacity duration-200 ${canScrollLeft ? "opacity-100" : "opacity-0"}`}
            style={{ background: `linear-gradient(to right, ${SURFACE}, transparent)` }}
          />
          <div
            className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-8 transition-opacity duration-200 ${canScrollRight ? "opacity-100" : "opacity-0"}`}
            style={{ background: `linear-gradient(to left, ${SURFACE}, transparent)` }}
          />

          <div
            ref={trackRef}
            onScroll={updateArrows}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {pairs.map((pair, i) => (
              <Card key={`${pair.carA.id}-${pair.carB.id}-${i}`} pair={pair} />
            ))}
          </div>
        </div>

        <p className="mt-3 text-[11px]" style={{ color: MUTED }}>
          *Ex-showroom price, New Delhi
        </p>
      </div>
    </section>
  );
}

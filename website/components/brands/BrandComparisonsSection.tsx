"use client";

import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import BrandCompareCard from "./BrandCompareCard";
import type { RandomComparisonPair } from "@/features/compare/compare.types";

// One horizontally-scrolling row — 3 cards visible at a time on desktop,
// the rest reachable by sliding — rather than a grid that wraps everything
// into extra rows up front.
export default function BrandComparisonsSection({
  pairs,
  eyebrow,
  title,
  subtitle,
}: {
  pairs: RandomComparisonPair[];
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  if (pairs.length === 0) return null;

  return (
    <section className="py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          href="/compare-cars"
          linkLabel="Compare any cars"
          after={
            <ScrollArrows
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onLeft={() => scrollBy("left")}
              onRight={() => scrollBy("right")}
            />
          }
        />

        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-none"
        >
          {pairs.map((pair, i) => (
            <div key={`${pair.carA.id}-${pair.carB.id}-${i}`} className="w-full shrink-0 snap-start sm:w-1/2 lg:w-1/3">
              <BrandCompareCard pair={pair} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

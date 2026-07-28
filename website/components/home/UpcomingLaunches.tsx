"use client";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import UpcomingCarCard from "@/components/cars/UpcomingCarCard";
import type { HomeCar } from "@/features/cars/car.types";

const SURFACE = "#f4f5f9";

export default function UpcomingLaunches({ cars }: { cars: HomeCar[] }) {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  if (cars.length === 0) return null;

  return (
    <section className="py-12 sm:py-16" style={{ background: SURFACE }}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Latest Launches"
          title="Upcoming cars in India"
          subtitle="Real-time countdowns for the most anticipated launches"
          href="/upcoming-cars"
          linkLabel="View all launches"
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
          {cars.map((car) => (
            <UpcomingCarCard key={car.id} car={car} />
          ))}
        </div>
      </div>
    </section>
  );
}

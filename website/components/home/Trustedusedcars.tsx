// components/home/Trustedusedcars.tsx
//
// Used cars in the visitor's chosen city. Renders nothing at all unless
// a city is set AND that city has active listings — an empty "cars near
// you" rail is worse than no section, and there is no honest fallback
// when the whole point is locality.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import UsedCarCard from "@/components/cars/UsedCarCard";
import { CITY_EVENT, getCurrentCity } from "@/features/location/currentCity";
import { getUsedCarsByCity } from "@/features/usedCars/usedCar.api";
import type { LocationCity } from "@/features/location/location.types";
import type { UsedCarListing } from "@/features/usedCars/usedCar.types";
import { routes } from "@/lib/routes";

export default function TrustedUsedCars() {
  const [city, setCity] = useState<LocationCity | null>(null);
  // Keyed by slug so a pending fetch for the previous city can never
  // render its listings under the new city's heading.
  const [result, setResult] = useState<{ slug: string; listings: UsedCarListing[] } | null>(null);
  const { trackRef, canScrollLeft, canScrollRight, updateArrows } = useScrollRail<HTMLDivElement>();

  useEffect(() => {
    setCity(getCurrentCity());
    const sync = (e: Event) => setCity((e as CustomEvent<LocationCity>).detail);
    window.addEventListener(CITY_EVENT, sync);
    return () => window.removeEventListener(CITY_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!city) return;
    let alive = true;
    const slug = city.slug;
    getUsedCarsByCity(slug).then((res) => {
      if (alive) setResult({ slug, listings: res?.listings ?? [] });
    });
    return () => {
      alive = false;
    };
  }, [city]);

  const listings = result && city && result.slug === city.slug ? result.listings : [];
  if (!city || listings.length === 0) return null;

  const scrollByCard = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.children[0] as HTMLElement | undefined;
    const second = el.children[1] as HTMLElement | undefined;
    const step = first && second ? second.offsetLeft - first.offsetLeft : el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <section className="bg-page py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Find Nearby"
          title={`Get trusted used cars in ${city.name}`}
          subtitle="Verified listings available near you"
          after={
            <ScrollArrows
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onLeft={() => scrollByCard("left")}
              onRight={() => scrollByCard("right")}
            />
          }
        />

        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
        >
          {listings.map((car) => (
            <UsedCarCard key={car.id} car={car} variant="rail" />
          ))}
        </div>

        <Link
          href={routes.usedCarsInCity(city.slug)}
          className="mt-5 inline-block rounded-md border-[1.5px] border-brand px-4 py-2 text-[13px] font-bold text-brand no-underline transition-colors hover:bg-brand-soft"
        >
          View all used cars in {city.name}
        </Link>
      </div>
    </section>
  );
}

"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import { WishlistButton } from "@/components/common/CardBits";
import { FuelIcon, StarIcon } from "@/components/common/icons";
import { formatSinglePrice } from "@/lib/format";
import type { HomeCar } from "@/features/cars/car.types";

const ORANGE = "#f2650f";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const SURFACE = "#f4f5f9";
const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='225' viewBox='0 0 300 225'%3E%3Crect width='300' height='225' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const useDaysLeft = (date: string | null) => {
  const [days, setDays] = useState(0);
  useEffect(() => {
    if (!date) return;
    const calc = () => setDays(Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)));
    calc();
    const interval = setInterval(calc, 3600000);
    return () => clearInterval(interval);
  }, [date]);
  return days;
};

const Spec = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span style={{ color: "#9aa1ad" }}>{icon}</span>
    <span className="text-[11.5px] font-semibold" style={{ color: DARK }}>
      {label}
    </span>
  </div>
);

const Card = ({ car }: { car: HomeCar }) => {
  const days = useDaysLeft(car.expectedLaunchDate);
  const isUpcoming = days > 0;
  const price = formatSinglePrice(car.priceMin, "TBA");

  return (
    <div
      className="group flex h-full w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1"
      style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(17,24,39,0.04)" }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 12px 28px rgba(17,24,39,0.12)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 2px rgba(17,24,39,0.04)")}
    >
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: SURFACE }}>
        <Image
          src={car.coverImageUrl ?? FALLBACK_IMG}
          alt={car.name}
          fill
          sizes="260px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />

        <div
          className="absolute inset-x-0 top-0 h-16"
          style={{ background: "linear-gradient(180deg, rgba(17,24,39,0.35), transparent)" }}
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex items-center gap-1.5">
            {car.bodyType && (
              <span
                className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm"
                style={{ color: DARK }}
              >
                {car.bodyType.name}
              </span>
            )}
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
              style={{ background: ORANGE }}
            >
              Coming Soon
            </span>
          </div>

          <WishlistButton size="sm" />
        </div>

        {isUpcoming && (
          <span
            className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm"
            style={{ background: "rgba(17,24,39,0.78)" }}
          >
            <span className="tabular-nums" style={{ color: "#ff8a3d" }}>
              {days}
            </span>{" "}
            {days === 1 ? "day" : "days"} left
          </span>
        )}

        {car.ratingAvg && (
          <span
            className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10.5px] font-bold backdrop-blur-sm"
            style={{ color: DARK }}
          >
            <StarIcon filled className="size-3 text-amber-400" />
            {car.ratingAvg}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pt-4">
        <div>
          <h3 className="text-[15.5px] font-bold leading-tight" style={{ color: DARK }}>
            {car.name}
          </h3>
          <p className="mt-1 text-[11px] font-medium" style={{ color: MUTED }}>
            {car.expectedLaunchDate ? `Launching on ${DATE_FMT.format(new Date(car.expectedLaunchDate))}` : "Launch date TBA"}
          </p>
        </div>

        <div>
          <p className="text-[18px] font-bold leading-none" style={{ color: DARK }}>
            {price}
            <span className="ml-1 align-middle text-[10.5px] font-semibold" style={{ color: MUTED }}>
              *est.
            </span>
          </p>
          <p className="mt-1 text-[10px] font-medium" style={{ color: "#9aa1ad" }}>
            Estimated price, subject to change
          </p>
        </div>

        <div className="flex items-center gap-3 border-t pt-3" style={{ borderColor: "#f0f1f4" }}>
          <Spec icon={<FuelIcon className="size-4" />} label={car.isElectric ? "Electric" : "Petrol/Diesel"} />
        </div>
      </div>

      <div className="mt-auto px-4 pb-4 pt-3.5">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-[12.5px] font-bold transition-colors hover:bg-orange-50"
          style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE }}
        >
          Notify me at launch
        </button>
      </div>
    </div>
  );
};

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
          href="#"
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
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {cars.map((car) => (
            <Card key={car.id} car={car} />
          ))}
        </div>
      </div>
    </section>
  );
}

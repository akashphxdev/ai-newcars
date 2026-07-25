"use client";
import Image from "next/image";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import { WishlistButton } from "@/components/common/CardBits";
import { BoltIcon, ClockIcon, GaugeIcon, StarIcon, BatteryIcon } from "@/components/common/icons";
import { formatSinglePrice } from "@/lib/format";
import type { HomeCar } from "@/features/cars/car.types";

const ORANGE = "#f2650f";
const DARK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e5e7eb";
const SURFACE = "#f4f5f9";
const TEAL = "#0d9488";
const TEAL_SOFT = "#e6f6f4";
const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'%3E%3Crect width='320' height='200' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const MiniSpec = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="flex items-center gap-2 rounded-xl px-2.5 py-2" style={{ background: SURFACE }}>
    <span
      className="flex size-7 shrink-0 items-center justify-center rounded-lg"
      style={{ background: TEAL_SOFT, color: TEAL }}
    >
      {icon}
    </span>
    <div className="leading-tight">
      <p className="text-[12px] font-bold" style={{ color: DARK }}>
        {value}
      </p>
      <p className="text-[9.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
        {label}
      </p>
    </div>
  </div>
);

// Two data-driven highlights — "longest range" and "best value" — computed
// from whatever's in the list. "Fastest charging" was dropped: the backend's
// chargeTime is free text (e.g. "0-80% in 45 min"), not a clean number, so
// it can't be reliably compared across cars.
function useSmartBadge(cars: HomeCar[]) {
  const withRange = cars.filter((c) => c.specs?.range);
  const withPrice = cars.filter((c) => c.priceMin);
  const longestRangeId = withRange.length
    ? withRange.reduce((a, b) => ((b.specs!.range ?? 0) > (a.specs!.range ?? 0) ? b : a)).id
    : null;
  const bestValueId = withPrice.length
    ? withPrice.reduce((a, b) => (Number(b.priceMin) < Number(a.priceMin) ? b : a)).id
    : null;

  return (car: HomeCar): string | null => {
    if (car.id === longestRangeId) return "Longest Range";
    if (car.id === bestValueId) return "Best Value";
    return null;
  };
}

const Card = ({ car, badge }: { car: HomeCar; badge: string | null }) => {
  return (
    <div
      className="flex h-full w-[320px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1"
      style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
    >
      <div className="relative aspect-[16/10] overflow-hidden" style={{ background: SURFACE }}>
        <Image src={car.coverImageUrl ?? FALLBACK_IMG} alt={`${car.brand.name} ${car.name}`} fill sizes="320px" className="object-cover" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ background: TEAL }}
            >
              <BoltIcon className="size-3.5" />
              Electric
            </span>
            {car.bodyType && (
              <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: DARK }}>
                {car.bodyType.name}
              </span>
            )}
          </div>

          <WishlistButton size="md" />
        </div>

        {badge && (
          <span
            className="absolute bottom-3 left-3 rounded-md bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
            style={{ color: DARK }}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3.5 px-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
              {car.brand.name}
            </p>
            <h3 className="text-[17px] font-bold leading-tight" style={{ color: DARK }}>
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

        <div className="grid grid-cols-2 gap-2">
          <MiniSpec icon={<BatteryIcon className="size-4" />} value={car.specs?.batteryCapacity ? `${car.specs.batteryCapacity} kWh` : "-"} label="Battery" />
          <MiniSpec icon={<ClockIcon className="size-4" />} value={car.specs?.chargeTime ?? "-"} label="Charging" />
          <MiniSpec icon={<GaugeIcon className="size-4" />} value={car.specs?.topSpeedKmph ? `${car.specs.topSpeedKmph} km/h` : "-"} label="Top Speed" />
          <MiniSpec icon={<BoltIcon className="size-3.5" />} value={formatSinglePrice(car.priceMin)} label="Starting Price" />
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 px-4 pb-4 pt-3.5">
        <a
          href={`/new-cars/${car.slug}`}
          className="flex h-11 flex-1 items-center justify-center rounded-xl px-3 text-[12.5px] font-bold"
          style={{ border: `1px solid ${BORDER}`, color: DARK }}
        >
          View Details
        </a>
        <button
          type="button"
          className="flex h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[12.5px] font-bold transition-colors hover:bg-orange-50"
          style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE }}
        >
          Check Offers
        </button>
      </div>
    </div>
  );
};

export default function ElectricCars({ cars }: { cars: HomeCar[] }) {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();
  const getBadge = useSmartBadge(cars);

  if (cars.length === 0) return null;

  return (
    <section className="py-14 sm:py-16" style={{ background: "#fff" }}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          icon={<BoltIcon className="size-3.5" />}
          tone="ev"
          divider
          eyebrow="Zero Emissions"
          title="Electric cars, ranked by range"
          subtitle="Real-world tested range, battery, and charging specs — updated today so you can compare with confidence."
          href="/electric-cars"
          linkLabel="View all EVs"
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
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {cars.map((car) => (
            <Card key={car.id} car={car} badge={getBadge(car)} />
          ))}
        </div>
      </div>
    </section>
  );
}

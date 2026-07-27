"use client";
import Image from "next/image";
import Link from "next/link";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import { WishlistButton } from "@/components/common/CardBits";
import { PowerIcon, TorqueIcon, GaugeIcon, StarIcon } from "@/components/common/icons";
import { formatPriceRange } from "@/lib/format";
import type { HomeCar } from "@/features/cars/car.types";

const ORANGE = "#f2650f";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const SURFACE = "#f4f5f9";
const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='225' viewBox='0 0 300 225'%3E%3Crect width='300' height='225' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const Spec = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span style={{ color: "#9aa1ad" }}>{icon}</span>
    <div className="leading-tight">
      <p className="text-[12px] font-bold" style={{ color: DARK }}>
        {value}
      </p>
      <p className="text-[10px] font-medium" style={{ color: MUTED }}>
        {label}
      </p>
    </div>
  </div>
);

const Card = ({ car }: { car: HomeCar }) => {
  const modelUrl = `/${car.brand.slug}-cars/${car.slug}`;

  return (
    <div
      className="flex h-full w-[248px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: SURFACE }}>
        <Link href={modelUrl} className="absolute inset-0 z-0" aria-label={`View ${car.brand.name} ${car.name} details`}>
          <Image src={car.coverImageUrl ?? FALLBACK_IMG} alt={`${car.brand.name} ${car.name}`} fill sizes="248px" className="object-cover" />
        </Link>

        {car.bodyType && (
          <div className="absolute left-3 top-3 z-10">
            <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: DARK }}>
              {car.bodyType.name}
            </span>
          </div>
        )}

        <div className="absolute right-3 top-3 z-10">
          <WishlistButton size="md" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-3.5 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em]" style={{ color: MUTED }}>
              {car.brand.name}
            </p>
            <h3 className="text-[15px] font-bold leading-tight" style={{ color: DARK }}>
              {car.name}
            </h3>
          </div>
          {car.ratingAvg && (
            <div className="flex shrink-0 items-center gap-1 pt-0.5">
              <StarIcon filled className="size-3 text-amber-400" />
              <span className="text-[12px] font-bold" style={{ color: DARK }}>
                {car.ratingAvg}
              </span>
            </div>
          )}
        </div>

        <p className="text-[16.5px] font-extrabold leading-none" style={{ color: DARK }}>
          {formatPriceRange(car.priceMin, car.priceMax)}
          <span className="block pt-1 text-[11px] font-semibold" style={{ color: MUTED }}>
            *ex-showroom
          </span>
        </p>

        <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "#f0f1f4" }}>
          <Spec icon={<PowerIcon className="size-4" />} value={car.specs?.powerPs ? `${car.specs.powerPs} PS` : "-"} label="Power" />
          <Spec icon={<TorqueIcon className="size-4" />} value={car.specs?.torqueNm ? `${car.specs.torqueNm} Nm` : "-"} label="Torque" />
          <Spec icon={<GaugeIcon className="size-4" />} value={car.specs?.mileage ? `${car.specs.mileage} km/l` : "-"} label="Mileage" />
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 px-3.5 pb-3.5 pt-3">
        <Link
          href={modelUrl}
          className="flex-1 rounded-xl px-3 py-2.5 text-center text-[12px] font-bold"
          style={{ border: `1px solid ${BORDER}`, color: DARK }}
        >
          View Details
        </Link>
        <Link
          href={modelUrl}
          className="flex-1 whitespace-nowrap rounded-xl px-3 py-2.5 text-center text-[12px] font-bold transition-colors hover:bg-orange-50"
          style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE }}
        >
          Check Offers
        </Link>
      </div>
    </div>
  );
};

export default function PopularCars({ cars }: { cars: HomeCar[] }) {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  if (cars.length === 0) return null;

  return (
    <section className="py-12 sm:py-16" style={{ background: SURFACE }}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Most Searched"
          title="Popular cars"
          href="#"
          linkLabel="View all popular cars"
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

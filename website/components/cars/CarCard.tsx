// components/cars/CarCard.tsx
//
// The one car card. Replaces BrandCarCard, ElectricCarCard and
// UpcomingCarCard, which were three near-identical implementations that
// had drifted apart: three widths, three image aspect ratios (4:3, 16:10,
// 4:3), three copies of a fallback SVG, and two copies of the same spec
// row. Two of them also predated the design tokens and hardcoded their
// own hex constants, so a palette change had to be made in three places.
//
// Everything that varies is derived from the car itself, so callers pass
// data rather than configuration:
//   - EV vs combustion specs        -> car.isElectric
//   - countdown / "TBA" / notify    -> car.launchStatus
// `variant` only controls sizing, because that genuinely is the caller's
// concern: a grid cell stretches, a horizontal rail cannot.

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WishlistButton } from "@/components/common/CardBits";
import LaunchNotifyModal from "@/components/leads/LaunchNotifyModal";
import { submitLaunchNotifyLead } from "@/features/leads/lead.api";
import {
  PowerIcon,
  TorqueIcon,
  GaugeIcon,
  BatteryIcon,
  ClockIcon,
  StarIcon,
} from "@/components/common/icons";
import { formatPriceRange, formatSinglePrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { HomeCar } from "@/features/cars/car.types";

// Inline so a missing image never costs a network round-trip to discover.
const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='225' viewBox='0 0 300 225'%3E%3Crect width='300' height='225' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

export type CarCardVariant = "grid" | "rail" | "wide" | "curated" | "curated-wide";

const SIZING: Record<CarCardVariant, { wrapper: string; sizes: string }> = {
  // Fills its grid cell; the grid decides the column count.
  grid: { wrapper: "w-full", sizes: "(max-width: 640px) 90vw, 280px" },
  // Fixed width so a horizontal rail scrolls predictably.
  rail: { wrapper: "w-[272px] shrink-0 snap-start", sizes: "272px" },
  // Fills a full-width slot by laying the image beside the details
  // instead of above them, so the card stays short.
  wide: { wrapper: "w-full", sizes: "(max-width: 640px) 90vw, 300px" },
  // Curated-only editorial treatments. They preserve the card's actions,
  // wishlist and upcoming-car flow while matching the homepage showcase.
  curated: { wrapper: "w-full", sizes: "(max-width: 640px) 100vw, 360px" },
  "curated-wide": { wrapper: "w-full", sizes: "(max-width: 640px) 100vw, 360px" },
};

function Spec({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="shrink-0 text-faint">{icon}</span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[12px] font-bold text-ink tabular-nums">{value}</p>
        <p className="truncate text-[10px] font-medium text-muted">{label}</p>
      </div>
    </div>
  );
}

function daysUntil(iso: string | null): number {
  if (!iso) return 0;
  const diff = new Date(iso).getTime() - Date.now();
  return diff <= 0 ? 0 : Math.ceil(diff / 86_400_000);
}

export default function CarCard({
  car,
  variant = "grid",
}: {
  car: HomeCar;
  variant?: CarCardVariant;
}) {
  const [notifyOpen, setNotifyOpen] = useState(false);

  const modelUrl = routes.model(car.brand.slug, car.slug);
  const isUpcoming = car.launchStatus === "upcoming";
  const days = isUpcoming ? daysUntil(car.expectedLaunchDate) : 0;
  const { wrapper, sizes } = SIZING[variant];
  const isCurated = variant === "curated" || variant === "curated-wide";
  const isWide = variant === "wide" || variant === "curated-wide";

  // An unreleased car has no confirmed price, so "TBA" is the honest
  // answer rather than a range built from a placeholder.
  const price = isUpcoming
    ? formatSinglePrice(car.priceMin, "TBA")
    : formatPriceRange(car.priceMin, car.priceMax);

  return (
    <>
      <div
        className={`${wrapper} group flex h-full overflow-hidden border border-border bg-surface ${
          isCurated
            ? "rounded-[8px] shadow-[0_18px_48px_-42px_rgba(92,67,45,0.65)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-faint hover:shadow-[0_24px_54px_-38px_rgba(92,67,45,0.7)]"
            : "rounded-xl transition-shadow duration-200 hover:shadow-md"
        } ${
          variant === "curated-wide" ? "flex-col sm:flex-row" : isWide ? "flex-row" : "flex-col"
        }`}
      >
        <div
          className={`relative overflow-hidden bg-page ${
            isWide
              ? isCurated
                ? "aspect-[16/10] w-full shrink-0 sm:min-h-[230px] sm:w-[46%] sm:aspect-auto"
                : "w-2/5 shrink-0"
              : isCurated
                ? "aspect-[16/10]"
                : "aspect-4/3"
          }`}
        >
          <Link
            href={modelUrl}
            className="absolute inset-0 z-0"
            aria-label={`View ${car.brand.name} ${car.name} details`}
          >
            <Image
              src={car.coverImageUrl ?? FALLBACK_IMG}
              alt={`${car.brand.name} ${car.name}`}
              fill
              sizes={sizes}
              className={isCurated ? "object-contain p-3 transition-transform duration-500 group-hover:scale-[1.025]" : "object-cover"}
            />
          </Link>

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {car.bodyType && (
                <span className="rounded-sm bg-surface/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink backdrop-blur-sm">
                  {car.bodyType.name}
                </span>
              )}
              {isUpcoming && (
                <span className="rounded-sm bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Upcoming
                </span>
              )}
            </div>
            <div className="pointer-events-auto">
              <WishlistButton modelId={car.id} size="md" />
            </div>
          </div>

          {isUpcoming && days > 0 && (
            <span className="absolute bottom-2.5 left-2.5 z-10 rounded-sm bg-ink/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              <span className="tabular-nums text-brand">{days}</span>{" "}
              {days === 1 ? "day" : "days"} left
            </span>
          )}
        </div>

        <div className={`flex min-w-0 flex-1 flex-col ${isCurated ? "gap-3 px-4 pt-4" : "gap-2.5 px-3.5 pt-3"}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">
                {car.brand.name}
              </p>
              <h3 className={`truncate font-bold leading-tight text-ink ${isCurated ? "font-head text-[17px]" : "text-[15px]"}`}>{car.name}</h3>
            </div>
            {car.ratingAvg && (
              <span className="flex shrink-0 items-center gap-1 pt-0.5">
                <StarIcon filled className="size-3 text-amber-400" />
                <span className="text-[12px] font-bold text-ink tabular-nums">{car.ratingAvg}</span>
              </span>
            )}
          </div>

          <p className={`font-bold text-ink tabular-nums ${isCurated ? "text-[16px]" : "text-[15.5px]"}`}>{price}</p>

          {isCurated ? (
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex min-h-7 items-center gap-1.5 rounded-[5px] border border-border px-2.5 py-1 text-[10.5px] font-semibold text-muted">
                {car.isElectric ? <BatteryIcon className="size-3.5" /> : <GaugeIcon className="size-3.5" />}
                {car.isElectric ? "Electric" : "Combustion"}
              </span>
              {car.bodyType && (
                <span className="inline-flex min-h-7 items-center gap-1.5 rounded-[5px] border border-border px-2.5 py-1 text-[10.5px] font-semibold text-muted">
                  <GaugeIcon className="size-3.5" />
                  {car.bodyType.name}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 border-t border-border-soft pt-2.5">
              {car.isElectric ? (
              <>
                <Spec
                  icon={<BatteryIcon className="size-4" />}
                  value={car.specs?.batteryCapacity ? `${car.specs.batteryCapacity} kWh` : "-"}
                  label="Battery"
                />
                <Spec
                  icon={<GaugeIcon className="size-4" />}
                  value={car.specs?.range ? `${car.specs.range} km` : "-"}
                  label={car.specs?.rangeEstimated ? "Est. range" : "Range"}
                />
                <Spec
                  icon={<ClockIcon className="size-4" />}
                  value={car.specs?.chargeTime ?? "-"}
                  label="Charging"
                />
              </>
            ) : (
              <>
                <Spec
                  icon={<PowerIcon className="size-4" />}
                  value={car.specs?.powerPs ? `${car.specs.powerPs} PS` : "-"}
                  label="Power"
                />
                <Spec
                  icon={<TorqueIcon className="size-4" />}
                  value={car.specs?.torqueNm ? `${car.specs.torqueNm} Nm` : "-"}
                  label="Torque"
                />
                <Spec
                  icon={<GaugeIcon className="size-4" />}
                  value={car.specs?.mileage ? `${car.specs.mileage} km/l` : "-"}
                  label="Mileage"
                />
              </>
              )}
            </div>
          )}
        </div>

        <div className={`mt-auto flex items-center gap-2 ${isCurated ? "px-4 pb-4 pt-4" : "px-3.5 pb-3.5 pt-3"}`}>
          <Link
            href={modelUrl}
            className={`flex-1 border border-border px-3 py-2 text-center text-[12px] font-bold text-ink transition-colors hover:border-faint hover:bg-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${isCurated ? "min-h-10 rounded-[6px]" : "rounded-md"}`}
          >
            View details
          </Link>
          {isUpcoming ? (
            <button
              type="button"
              onClick={() => setNotifyOpen(true)}
              className={`flex-1 cursor-pointer whitespace-nowrap border-[1.5px] border-brand px-3 py-2 text-center text-[12px] font-bold text-brand transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${isCurated ? "min-h-10 rounded-[6px]" : "rounded-md"}`}
            >
              Notify me at launch
            </button>
          ) : (
            <Link
              href={modelUrl}
              className={`flex-1 whitespace-nowrap border-[1.5px] border-brand px-3 py-2 text-center text-[12px] font-bold text-brand transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${isCurated ? "min-h-10 rounded-[6px]" : "rounded-md"}`}
            >
              Check price
            </Link>
          )}
        </div>
      </div>

      {isUpcoming && notifyOpen && (
        <LaunchNotifyModal
          carName={car.name}
          imageUrl={car.coverImageUrl}
          onClose={() => setNotifyOpen(false)}
          onSubmit={async (values) => {
            await submitLaunchNotifyLead({ ...values, brandId: car.brand.id, modelId: car.id });
          }}
        />
      )}
    </>
  );
}

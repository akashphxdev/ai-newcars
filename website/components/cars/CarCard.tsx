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

export type CarCardVariant = "grid" | "rail";

const SIZING: Record<CarCardVariant, { wrapper: string; sizes: string }> = {
  // Fills its grid cell; the grid decides the column count.
  grid: { wrapper: "w-full", sizes: "(max-width: 640px) 90vw, 280px" },
  // Fixed width so a horizontal rail scrolls predictably.
  rail: { wrapper: "w-[272px] shrink-0 snap-start", sizes: "272px" },
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

  // An unreleased car has no confirmed price, so "TBA" is the honest
  // answer rather than a range built from a placeholder.
  const price = isUpcoming
    ? formatSinglePrice(car.priceMin, "TBA")
    : formatPriceRange(car.priceMin, car.priceMax);

  return (
    <>
      <div
        className={`${wrapper} group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow duration-200 hover:shadow-md`}
      >
        <div className="relative aspect-4/3 overflow-hidden bg-page">
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
              className="object-cover"
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

        <div className="flex flex-1 flex-col gap-2.5 px-3.5 pt-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">
                {car.brand.name}
              </p>
              <h3 className="truncate text-[15px] font-bold leading-tight text-ink">{car.name}</h3>
            </div>
            {car.ratingAvg && (
              <span className="flex shrink-0 items-center gap-1 pt-0.5">
                <StarIcon filled className="size-3 text-amber-400" />
                <span className="text-[12px] font-bold text-ink tabular-nums">{car.ratingAvg}</span>
              </span>
            )}
          </div>

          <p className="text-[15.5px] font-bold text-ink tabular-nums">{price}</p>

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
        </div>

        <div className="mt-auto flex items-center gap-2 px-3.5 pb-3.5 pt-3">
          <Link
            href={modelUrl}
            className="flex-1 rounded-md border border-border px-3 py-2 text-center text-[12px] font-bold text-ink transition-colors hover:bg-page"
          >
            View Details
          </Link>
          {isUpcoming ? (
            <button
              type="button"
              onClick={() => setNotifyOpen(true)}
              className="flex-1 cursor-pointer whitespace-nowrap rounded-md border-[1.5px] border-brand px-3 py-2 text-center text-[12px] font-bold text-brand transition-colors hover:bg-brand-soft"
            >
              Notify me at launch
            </button>
          ) : (
            <Link
              href={modelUrl}
              className="flex-1 whitespace-nowrap rounded-md border-[1.5px] border-brand px-3 py-2 text-center text-[12px] font-bold text-brand transition-colors hover:bg-brand-soft"
            >
              Check Offers
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

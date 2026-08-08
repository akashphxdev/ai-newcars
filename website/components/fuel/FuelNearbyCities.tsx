// components/fuel/FuelNearbyCities.tsx
//
// City pages used to link only back up to their state, so the ~800 of
// them formed a star with no edges between the points. Every city now
// links sideways to its neighbours, which is both how a reader compares
// and how a crawler reaches the long tail.

import Link from "next/link";
import type { StateCityFuelRow } from "@/features/fuel/fuel.types";
import { formatFuelChange, formatFuelPrice } from "@/lib/fuel";
import { routes } from "@/lib/routes";

const MAX = 11;

export default function FuelNearbyCities({
  stateSlug,
  stateName,
  currentSlug,
  cities,
}: {
  stateSlug: string;
  stateName: string;
  currentSlug: string;
  cities: StateCityFuelRow[];
}) {
  // Alphabetical put Gadchiroli ahead of Mumbai on the Pune page. The
  // cities a reader actually wants to compare against lead instead.
  const others = cities
    .filter((city) => city.citySlug !== currentSlug)
    .sort((a, b) =>
      Number(Boolean(b.isTopCity)) - Number(Boolean(a.isTopCity))
      || a.cityName.localeCompare(b.cityName))
    .slice(0, MAX);
  if (others.length === 0) return null;

  return (
    <section className="border-t border-border-soft bg-page">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-head text-[24px] font-extrabold leading-tight text-ink sm:text-[30px]">
              Petrol prices in other {stateName} cities
            </h2>
            <p className="mt-2 text-[13px] text-muted">
              Rates move with local VAT and freight, so neighbouring cities rarely match exactly.
            </p>
          </div>
          <Link
            href={routes.fuelPriceInState(stateSlug)}
            className="text-[12px] font-bold text-brand no-underline hover:text-brand-hover"
          >
            All {stateName} cities →
          </Link>
        </div>

        <ul className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((city) => {
            const change = formatFuelChange(city.prices.petrol?.change);
            return (
              <li key={city.citySlug}>
                <Link
                  href={routes.fuelPriceInCity(stateSlug, city.citySlug)}
                  className="flex min-h-14 items-center justify-between gap-3 rounded-[7px] border border-border bg-surface px-4 no-underline transition-colors hover:border-faint hover:bg-surface/80"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold text-ink">
                      Petrol price in {city.cityName}
                    </span>
                    <span className={`block text-[10px] font-semibold ${change.className}`}>
                      {change.label}
                    </span>
                  </span>
                  <span className="shrink-0 text-[14px] font-bold text-ink tabular-nums">
                    {formatFuelPrice(city.prices.petrol?.price)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

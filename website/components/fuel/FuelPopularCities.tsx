// components/fuel/FuelPopularCities.tsx
//
// The city table both reference sites open with. The curated list itself
// lives in the Go handler, keyed by state+city slug, so it can never name
// a city the database does not hold.

import FuelRateTable, { type FuelRateRow } from "@/components/fuel/FuelRateTable";
import Link from "next/link";
import type { PopularCityFuelPrices } from "@/features/fuel/fuel.types";
import { formatFuelPrice } from "@/lib/fuel";
import { routes } from "@/lib/routes";

export default function FuelPopularCities({ cities }: { cities: PopularCityFuelPrices[] }) {
  if (cities.length === 0) return null;

  const rows: FuelRateRow[] = cities.map((city) => ({
    key: `${city.stateSlug}/${city.citySlug}`,
    name: city.cityName,
    href: routes.fuelPriceInCity(city.stateSlug, city.citySlug),
    meta: city.stateName,
    prices: city.prices,
  }));

  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.74fr)_minmax(360px,0.26fr)] lg:items-start">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-brand">Popular cities</p>
            <h2 className="mt-2 max-w-3xl text-balance font-head text-[28px] font-extrabold leading-tight text-ink sm:text-[38px]">
              Today&apos;s fuel prices in major Indian cities
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-6 text-muted">
              Retail pump rates in the cities most people search for. Open any city for its 30-day trend
              and a monthly running-cost estimate.
            </p>
          </div>

          <div className="grid gap-2 rounded-[8px] border border-border bg-[#fbfaf8] p-3">
            {cities.slice(0, 3).map((city) => (
              <Link
                key={`${city.stateSlug}/${city.citySlug}`}
                href={routes.fuelPriceInCity(city.stateSlug, city.citySlug)}
                className="flex items-center justify-between gap-4 rounded-[5px] bg-surface px-3 py-2.5 text-ink no-underline transition hover:bg-[#fff3eb]"
              >
                <span>
                  <span className="block text-[12px] font-bold">{city.cityName}</span>
                  <span className="text-[10px] text-muted">{city.stateName}</span>
                </span>
                <span className="text-right text-[13px] font-extrabold tabular-nums">
                  {formatFuelPrice(city.prices.petrol?.price)}
                  <span className="ml-1 text-[10px] font-semibold text-muted">/L</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-7">
          <FuelRateTable rows={rows} nameHeader="Cities" />
        </div>
      </div>
    </section>
  );
}

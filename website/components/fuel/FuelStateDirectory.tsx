// components/fuel/FuelStateDirectory.tsx
//
// The state-wise table both reference sites lead their directory with.
// This used to list city counts and no prices at all, so a visitor had to
// open a state page to learn anything — the one number they came for was
// always one click away.

import FuelRateTable, { type FuelRateRow } from "@/components/fuel/FuelRateTable";
import Link from "next/link";
import type { FuelStatePrices } from "@/features/fuel/fuel.types";
import { formatFuelPrice } from "@/lib/fuel";
import { routes } from "@/lib/routes";

export default function FuelStateDirectory({ states }: { states: FuelStatePrices[] }) {
  const totalCities = states.reduce((total, state) => total + state.cityCount, 0);
  const topCoverage = [...states].sort((a, b) => b.cityCount - a.cityCount).slice(0, 3);
  const petrolStates = states.filter((state) => state.prices.petrol);
  const lowestPetrol = [...petrolStates].sort((a, b) => Number(a.prices.petrol) - Number(b.prices.petrol))[0];

  const rows: FuelRateRow[] = states.map((state) => ({
    key: state.slug,
    name: state.name,
    href: routes.fuelPriceInState(state.slug),
    meta: `${state.cityCount} ${state.cityCount === 1 ? "city" : "cities"}`,
    prices: Object.fromEntries(
      Object.entries(state.prices).map(([fuel, price]) => [fuel, { price }]),
    ),
  }));

  return (
    <section id="state-directory" className="border-t border-border-soft bg-page">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(340px,0.28fr)] lg:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-brand">State and city directory</p>
            <h2 className="mt-2 max-w-3xl text-balance font-head text-[28px] font-extrabold leading-tight text-ink sm:text-[38px]">
              Explore prices by state and city
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-6 text-muted">
              Fuel is taxed by the state, so rates differ across borders far more than across districts.
              Figures are the average of every city we track in that state. Open a state for
              its full city-wise table.
            </p>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-[8px] border border-border bg-surface text-center">
            <div className="border-r border-border px-3 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">States</p>
              <p className="mt-1 font-head text-[24px] font-extrabold text-ink tabular-nums">{states.length}</p>
            </div>
            <div className="border-r border-border px-3 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Cities</p>
              <p className="mt-1 font-head text-[24px] font-extrabold text-ink tabular-nums">{totalCities.toLocaleString("en-IN")}</p>
            </div>
            <div className="px-3 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Lowest petrol</p>
              <p className="mt-1 font-head text-[18px] font-extrabold text-ink tabular-nums">
                {formatFuelPrice(lowestPetrol?.prices.petrol)}
              </p>
            </div>
          </div>
        </div>

        {topCoverage.length > 0 && (
          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {topCoverage.map((state) => (
              <Link
                key={state.slug}
                href={routes.fuelPriceInState(state.slug)}
                className="group flex items-center justify-between gap-4 rounded-[8px] border border-border bg-surface px-4 py-3 text-ink no-underline transition hover:-translate-y-0.5 hover:border-faint hover:bg-[#fffaf7]"
              >
                <span>
                  <span className="block text-[13px] font-extrabold">{state.name}</span>
                  <span className="text-[10.5px] text-muted">{state.cityCount} tracked cities</span>
                </span>
                <span className="text-[12px] font-bold text-brand group-hover:text-brand-hover">View state</span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-7">
          <FuelRateTable
            rows={rows}
            nameHeader="States"
            priceNote="state average"
            collapseAfter={12}
          />
        </div>
      </div>
    </section>
  );
}

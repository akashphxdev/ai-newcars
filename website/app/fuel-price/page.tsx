import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BellIcon, PinIcon, SearchIcon, ShieldIcon } from "@/components/common/icons";
import FuelStateExplorer, { type StateCityFuelRow } from "@/components/fuel/FuelStateExplorer";
import FuelSummaryCard from "@/components/fuel/FuelSummaryCard";
import MetroFuelComparison from "@/components/fuel/MetroFuelComparison";
import {
  getFuelHistory,
  getFuelPricesInState,
  getFuelStates,
  getMetroFuelPrices,
} from "@/features/fuel/fuel.api";
import type { FuelCityRow, FuelName, FuelPoint } from "@/features/fuel/fuel.types";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Petrol, Diesel & CNG Prices in India Today | TimesAuto",
  description:
    "Today's petrol, diesel and CNG prices across Indian cities, updated daily with metro comparisons, state directories and local rate details.",
};

export const revalidate = 3600;

type Props = { searchParams: Promise<{ state?: string }> };

const FUEL_IDS: Record<FuelName, number> = { petrol: 1, diesel: 2, cng: 3 };

function mergeCityRows(rowsByFuel: Record<FuelName, FuelCityRow[]>): StateCityFuelRow[] {
  const cities = new Map<number, StateCityFuelRow>();

  (Object.keys(rowsByFuel) as FuelName[]).forEach((fuel) => {
    rowsByFuel[fuel].forEach((row) => {
      const city = cities.get(row.cityId) ?? {
        cityId: row.cityId,
        cityName: row.cityName,
        citySlug: row.citySlug,
        prices: {},
      };
      const point: FuelPoint = {
        price: row.price,
        change: row.change,
        updatedOn: row.updatedOn,
      };
      city.prices[fuel] = point;
      cities.set(row.cityId, city);
    });
  });

  return [...cities.values()].sort((a, b) => a.cityName.localeCompare(b.cityName));
}

export default async function FuelPricePage({ searchParams }: Props) {
  const [metros, states, query] = await Promise.all([
    getMetroFuelPrices(),
    getFuelStates(),
    searchParams,
  ]);

  const requestedStateId = Number(query.state);
  const selectedState =
    states.find((state) => state.id === requestedStateId) ??
    states.find((state) => state.name.toLowerCase() === "maharashtra") ??
    states[0];

  const [metroHistories, stateRows] = await Promise.all([
    Promise.all(metros.map(async (metro) => [metro.citySlug, await getFuelHistory(metro.citySlug, 1, 30)] as const)),
    selectedState
      ? Promise.all(
          (Object.keys(FUEL_IDS) as FuelName[]).map(async (fuel) => [
            fuel,
            await getFuelPricesInState(selectedState.id, FUEL_IDS[fuel]),
          ] as const),
        )
      : Promise.resolve([]),
  ]);

  const histories = Object.fromEntries(metroHistories);
  const rowsByFuel = Object.fromEntries(stateRows) as Record<FuelName, FuelCityRow[]>;
  const stateCities = selectedState ? mergeCityRows(rowsByFuel) : [];
  const featured = metros[0];
  const totalCities = states.reduce((total, state) => total + state.cityCount, 0);
  const asOf = featured?.prices.petrol?.updatedOn ?? featured?.prices.diesel?.updatedOn;

  return (
    <main className="bg-surface">
      <section className="relative overflow-hidden border-b border-border-soft bg-[#fcfbf9]">
        <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(#e8e9ed_1px,transparent_1px),linear-gradient(90deg,#e8e9ed_1px,transparent_1px)] [background-size:52px_52px]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:pb-20 sm:pt-10">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] text-muted">
            <Link href={routes.home()} className="text-muted no-underline hover:text-brand">Home</Link>
            <span>/</span>
            <span className="font-semibold text-ink">Fuel prices</span>
          </nav>

          <div className="mt-7 grid items-center gap-9 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative z-10">
              <p className="text-[11px] font-bold uppercase text-brand">Daily fuel watch</p>
              <h1 className="mt-3 max-w-2xl font-head text-[36px] font-extrabold leading-[1.05] text-ink sm:text-[48px]">
                Fuel prices in India
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted">
                Live petrol, diesel and CNG rates across {totalCities.toLocaleString("en-IN")} cities.
              </p>
              <p className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-muted">
                <span className="size-2 rounded-full bg-ev" /> Updated {asOf ?? "daily at 6:00 AM"}
              </p>

              <div id="city-search" className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={featured ? routes.fuelPriceInCity(featured.citySlug) : routes.fuelPrice()}
                  className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-[7px] border border-border bg-surface px-4 text-ink no-underline shadow-[0_10px_28px_-24px_rgba(17,24,39,0.55)] hover:border-faint sm:max-w-[360px]"
                >
                  <PinIcon className="size-5" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">{featured?.cityName ?? "Select city"}</span>
                    <span className="mt-0.5 block text-[10px] text-muted">Check prices in your city</span>
                  </span>
                  <SearchIcon className="size-4 text-muted" />
                </Link>
                <Link
                  href={featured ? `${routes.fuelPriceInCity(featured.citySlug)}#fuel-alert` : routes.fuelPrice()}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[7px] border border-ink px-5 text-[12px] font-bold text-ink no-underline transition-colors hover:bg-ink hover:text-white"
                >
                  <BellIcon className="size-4" /> Set price alert
                </Link>
              </div>

              <p className="mt-5 flex items-center gap-2 text-[10px] text-muted">
                <ShieldIcon className="size-3.5" /> Prices include state taxes and dealer commission.
              </p>
            </div>

            <div className="relative aspect-[16/9] overflow-hidden rounded-[8px] border border-border bg-page shadow-[0_30px_70px_-52px_rgba(17,24,39,0.7)]">
              <Image
                src="/design/fuel-prices/hero-nozzle.png"
                alt="Orange petrol nozzle filling a silver car"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 54vw"
                className="object-cover"
              />
            </div>
          </div>

          {featured && (
            <div className="mt-12">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-[12px] font-bold uppercase text-ink">
                  <PinIcon className="size-4" /> {featured.cityName}
                </p>
                <a href="#metro-comparison" className="text-[11px] font-bold text-brand no-underline hover:text-brand-hover">Compare with another city →</a>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {(["petrol", "diesel", "cng"] as FuelName[]).map((fuel) => (
                  <FuelSummaryCard key={fuel} fuel={fuel} point={featured.prices[fuel]} citySlug={featured.citySlug} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {metros.length > 0 && <MetroFuelComparison metros={metros} histories={histories} />}

      {selectedState && (
        <FuelStateExplorer
          states={states}
          selectedState={selectedState}
          cities={stateCities}
          homeCity={featured?.cityName ?? "New Delhi"}
        />
      )}
    </main>
  );
}

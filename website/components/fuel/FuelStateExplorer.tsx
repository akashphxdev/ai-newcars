"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BellIcon,
  CalculatorIcon,
  ChevronIcon,
  CompareIcon,
  PinIcon,
  SearchIcon,
} from "@/components/common/icons";
import type { FuelName, FuelPoint, FuelState } from "@/features/fuel/fuel.types";
import { formatFuelChange, formatFuelPrice } from "@/lib/fuel";
import { routes } from "@/lib/routes";

export interface StateCityFuelRow {
  cityId: number;
  cityName: string;
  citySlug: string;
  prices: Partial<Record<FuelName, FuelPoint>>;
}

const LETTERS = ["A", "B", "C", "D", "G", "H", "J", "K", "M", "O", "P", "R", "S", "T", "U", "W"];

export default function FuelStateExplorer({
  states,
  selectedState,
  cities,
  homeCity,
}: {
  states: FuelState[];
  selectedState: FuelState;
  cities: StateCityFuelRow[];
  homeCity: string;
}) {
  const [stateQuery, setStateQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [view, setView] = useState<"state" | "city">("state");
  const [fuelFilter, setFuelFilter] = useState<"all" | FuelName>("all");
  const [sortOrder, setSortOrder] = useState<"name" | "petrol-low">("name");
  const [alertsOn, setAlertsOn] = useState(false);
  // The table showed 12 of however many the state holds, with no way to
  // reach the rest — Uttar Pradesh has 76, so 64 were unreachable.
  const [showAllCities, setShowAllCities] = useState(false);

  const visibleStates = useMemo(() => {
    const query = stateQuery.trim().toLowerCase();
    if (!query) return states;
    return states.filter((state) => state.name.toLowerCase().startsWith(query));
  }, [stateQuery, states]);

  const visibleCities = useMemo(() => {
    const query = cityQuery.trim().toLowerCase();
    const filtered = query ? cities.filter((city) => city.cityName.toLowerCase().includes(query)) : cities;
    return [...filtered].sort((a, b) => {
      if (sortOrder === "petrol-low") {
        return Number(a.prices.petrol?.price ?? Infinity) - Number(b.prices.petrol?.price ?? Infinity);
      }
      return a.cityName.localeCompare(b.cityName);
    });
  }, [cities, cityQuery, sortOrder]);

  const visibleFuels: FuelName[] = fuelFilter === "all" ? ["petrol", "diesel", "cng"] : [fuelFilter];

  function downloadCsv() {
    const header = ["City", "Petrol", "Diesel", "CNG", "Updated"];
    const rows = cities.map((city) => [
      city.cityName,
      city.prices.petrol?.price ?? "",
      city.prices.diesel?.price ?? "",
      city.prices.cng?.price ?? "",
      city.prices.petrol?.updatedOn ?? city.prices.diesel?.updatedOn ?? city.prices.cng?.updatedOn ?? "",
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedState.name.toLowerCase().replaceAll(" ", "-")}-fuel-prices.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section id="state-directory" className="bg-page py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-brand">State &amp; city directory</p>
            <h2 className="mt-2 font-head text-[28px] font-extrabold leading-tight text-ink sm:text-[36px]">
              Explore prices by state and city
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-6 text-muted">
              Browse local rates, save your home city and export the latest state report.
            </p>
          </div>
          <div className="inline-grid grid-cols-3 self-start overflow-hidden rounded-[7px] border border-border bg-surface lg:self-auto">
            <button type="button" onClick={() => setView("state")} className={`min-h-11 cursor-pointer border-r border-border px-5 text-[12px] font-bold ${view === "state" ? "bg-brand text-white" : "hover:bg-page"}`}>By state</button>
            <button type="button" onClick={() => setView("city")} className={`min-h-11 cursor-pointer border-r border-border px-5 text-[12px] font-bold ${view === "city" ? "bg-brand text-white" : "hover:bg-page"}`}>By city</button>
            <a href="#city-search" className="inline-flex min-h-11 items-center justify-center px-5 text-[12px] font-bold text-ink no-underline hover:bg-page">Near me</a>
          </div>
        </div>

        <div className={`mt-8 grid overflow-hidden rounded-[8px] border border-border bg-surface shadow-[0_26px_70px_-60px_rgba(17,24,39,0.55)] ${view === "state" ? "lg:grid-cols-[250px_minmax(0,1fr)_280px]" : "lg:grid-cols-[minmax(0,1fr)_280px]"}`}>
          {view === "state" && (
            <aside className="border-b border-border lg:border-b-0 lg:border-r">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-ink">States &amp; UTs</h3>
                  <span className="text-[11px] text-muted tabular-nums">{states.length}</span>
                </div>
                <label className="mt-4 flex min-h-11 items-center gap-2 rounded-[6px] border border-border bg-surface px-3 focus-within:border-faint">
                  <SearchIcon className="size-4 text-muted" />
                  <input value={stateQuery} onChange={(event) => setStateQuery(event.target.value)} placeholder="Search state" className="min-w-0 flex-1 bg-transparent text-[12px] text-ink placeholder:text-subtle" />
                </label>
                <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 border-b border-border-soft pb-3">
                  {LETTERS.map((letter) => (
                    <button key={letter} type="button" onClick={() => setStateQuery(letter)} className="cursor-pointer text-[9px] font-bold text-muted hover:text-brand">{letter}</button>
                  ))}
                </div>
              </div>
              <nav className="max-h-[610px] overflow-y-auto" aria-label="Fuel price states">
                {visibleStates.map((state) => {
                  const selected = state.id === selectedState.id;
                  return (
                    <Link
                      key={state.id}
                      href={`${routes.fuelPrice()}?state=${state.id}#state-directory`}
                      className={`flex min-h-11 items-center justify-between border-b border-border-soft px-4 text-[11.5px] font-semibold no-underline transition-colors ${selected ? "border-l-[3px] border-l-brand bg-[#fff7f2] text-ink" : "text-muted hover:bg-page hover:text-ink"}`}
                    >
                      <span>{state.name}</span>
                      <span className="flex items-center gap-2 tabular-nums">
                        {state.cityCount}
                        {selected && <ChevronIcon className="size-3" />}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          )}

          <div className="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
            <div className="border-b border-border p-5 sm:p-7">
              <p className="text-[10px] font-bold uppercase text-brand">{selectedState.name}</p>
              <h3 className="mt-2 font-head text-[23px] font-extrabold text-ink">Fuel prices in {selectedState.name}</h3>
              <p className="mt-2 text-[12px] text-muted">{selectedState.cityCount} cities · latest available daily rates</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_170px]">
                <label className="flex min-h-11 items-center gap-2 rounded-[6px] border border-border bg-surface px-3 focus-within:border-faint">
                  <SearchIcon className="size-4 text-muted" />
                  <input value={cityQuery} onChange={(event) => setCityQuery(event.target.value)} placeholder={`Search city in ${selectedState.name}`} className="min-w-0 flex-1 bg-transparent text-[12px] text-ink placeholder:text-subtle" />
                </label>
                <select value={fuelFilter} onChange={(event) => setFuelFilter(event.target.value as "all" | FuelName)} className="min-h-11 rounded-[6px] border border-border bg-surface px-3 text-[12px] font-semibold text-ink">
                  <option value="all">All fuels</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="cng">CNG</option>
                </select>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "name" | "petrol-low")} className="min-h-11 rounded-[6px] border border-border bg-surface px-3 text-[12px] font-semibold text-ink">
                  <option value="name">Sort: City name</option>
                  <option value="petrol-low">Petrol: Low to high</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead className="bg-page text-[10px] font-bold uppercase text-muted">
                  <tr>
                    <th className="px-5 py-3.5">City</th>
                    {visibleFuels.map((fuel) => <th key={fuel} className="px-4 py-3.5">{fuel}</th>)}
                    <th className="px-4 py-3.5">Updated</th>
                    <th className="px-4 py-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {(showAllCities ? visibleCities : visibleCities.slice(0, 12)).map((city, index) => {
                    const update = city.prices.petrol?.updatedOn ?? city.prices.diesel?.updatedOn ?? city.prices.cng?.updatedOn;
                    return (
                      <tr key={city.cityId} className={index === 0 ? "bg-[#fffaf7]" : "hover:bg-page/60"}>
                        <td className="px-5 py-3.5">
                          <p className="text-[12px] font-bold text-ink">{city.cityName}</p>
                          {index === 0 && <p className="mt-0.5 text-[9px] font-semibold text-brand">Popular city</p>}
                        </td>
                        {visibleFuels.map((fuel) => {
                          const point = city.prices[fuel];
                          const change = formatFuelChange(point?.change);
                          return (
                            <td key={fuel} className="px-4 py-3.5">
                              <p className="text-[12px] font-bold text-ink tabular-nums">{formatFuelPrice(point?.price)}</p>
                              {point && <p className={`mt-0.5 text-[9px] font-semibold ${change.className}`}>{change.label}</p>}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3.5 text-[10px] text-muted tabular-nums">{update ?? "—"}</td>
                        <td className="px-4 py-3.5">
                          <Link href={routes.fuelPriceInCity(city.citySlug)} className="text-[11px] font-bold text-brand no-underline hover:text-brand-hover">View prices →</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
              {visibleCities.length > 12 && (
                <button
                  type="button"
                  onClick={() => setShowAllCities((v) => !v)}
                  className="mt-3 w-full cursor-pointer rounded-[6px] border border-border py-2.5 text-[12px] font-bold text-ink transition-colors hover:border-faint hover:bg-page"
                >
                  {showAllCities
                    ? "Show fewer cities"
                    : `Show all ${visibleCities.length} cities`}
                </button>
              )}
            {visibleCities.length === 0 && (
              <div className="flex min-h-48 items-center justify-center px-6 text-center text-[13px] text-muted">No cities match this search.</div>
            )}
            <div className="flex items-center justify-between border-t border-border px-5 py-4 text-[10px] text-muted">
              <span>Showing {Math.min(visibleCities.length, 12)} of {visibleCities.length} cities</span>
              <span className="tabular-nums">Updated daily</span>
            </div>
          </div>

          <aside className="flex flex-col">
            <div className="border-b border-border p-5">
              <h3 className="text-[14px] font-bold text-ink">Your fuel tools</h3>
              <div className="mt-5 flex items-center gap-3">
                <PinIcon className="size-5 text-ink" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-semibold uppercase text-subtle">Home city</p>
                  <p className="mt-1 truncate text-[13px] font-bold text-ink">{homeCity}</p>
                </div>
                <a href="#city-search" className="text-[10px] font-bold text-brand no-underline">Change</a>
              </div>
            </div>

            <button type="button" onClick={() => setAlertsOn((current) => !current)} aria-pressed={alertsOn} className="flex min-h-[92px] cursor-pointer items-center gap-4 border-b border-border px-5 text-left hover:bg-page">
              <BellIcon className="size-5 text-ink" />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-bold text-ink">Price alerts</span>
                <span className="mt-1 block text-[10px] text-muted">Daily movement notification</span>
              </span>
              <span className={`relative h-6 w-11 rounded-full transition-colors ${alertsOn ? "bg-ev" : "bg-border"}`}>
                <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${alertsOn ? "translate-x-5" : "translate-x-0.5"}`} />
              </span>
            </button>

            <a href="#metro-comparison" className="flex min-h-[92px] items-center gap-4 border-b border-border px-5 text-left no-underline hover:bg-page">
              <CompareIcon className="size-5 text-ink" />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-bold text-ink">Compare cities</span>
                <span className="mt-1 block text-[10px] text-muted">Review selected metros</span>
              </span>
              <ChevronIcon className="size-4 text-muted" />
            </a>

            <Link href="/mileage-calculator" className="flex min-h-[92px] items-center gap-4 border-b border-border px-5 text-left no-underline hover:bg-page">
              <CalculatorIcon className="size-5 text-ink" />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-bold text-ink">Monthly fuel cost</span>
                <span className="mt-1 block text-[10px] text-muted">Estimate from your mileage</span>
              </span>
              <ChevronIcon className="size-4 text-muted" />
            </Link>

            <button type="button" onClick={downloadCsv} className="flex min-h-[92px] cursor-pointer items-center gap-4 border-b border-border px-5 text-left hover:bg-page">
              <span className="flex size-5 items-center justify-center text-lg text-ink">↓</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-bold text-ink">Download state report</span>
                <span className="mt-1 block text-[10px] text-muted">CSV · latest available rates</span>
              </span>
              <ChevronIcon className="size-4 text-muted" />
            </button>

            <Link href={routes.fuelPriceInCity(cities.find((city) => city.prices.cng)?.citySlug ?? cities[0]?.citySlug ?? "new-delhi")} className="relative mt-auto block aspect-[2/1] overflow-hidden bg-ink p-5 text-white no-underline">
              <Image src="/design/fuel-prices/cng-banner.png" alt="CNG filling coupling" fill sizes="280px" className="object-cover opacity-50" />
              <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.92),rgba(17,24,39,0.25))]" />
              <span className="relative z-10 block text-[9px] font-bold uppercase text-white/75">CNG availability</span>
              <span className="relative z-10 mt-2 block max-w-40 font-head text-[19px] font-bold leading-tight">Find CNG prices near you</span>
              <span className="relative z-10 mt-4 block text-[10px] font-bold text-[#ff8a47]">Explore nearby cities →</span>
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}

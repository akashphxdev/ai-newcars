"use client";

// The full city table for one state. Every row is rendered — a state page
// exists to be the complete directory for that state, so paging it would
// hide the very URLs the page is meant to expose. Filtering is client-side
// over data already on the page; no request is made here.

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "@/components/common/icons";
import type { FuelName, StateCityFuelRow } from "@/features/fuel/fuel.types";
import { formatFuelChange, formatFuelPrice } from "@/lib/fuel";
import { routes } from "@/lib/routes";

export default function FuelStateCityList({
  stateSlug,
  stateName,
  cities,
}: {
  stateSlug: string;
  stateName: string;
  cities: StateCityFuelRow[];
}) {
  const [query, setQuery] = useState("");
  const [fuelFilter, setFuelFilter] = useState<"all" | FuelName>("all");
  const [sortOrder, setSortOrder] = useState<"name" | "petrol-low">("name");

  const visibleCities = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? cities.filter((city) => city.cityName.toLowerCase().includes(q)) : cities;
    return [...filtered].sort((a, b) => {
      if (sortOrder === "petrol-low") {
        return Number(a.prices.petrol?.price ?? Infinity) - Number(b.prices.petrol?.price ?? Infinity);
      }
      return a.cityName.localeCompare(b.cityName);
    });
  }, [cities, query, sortOrder]);

  const visibleFuels: FuelName[] = fuelFilter === "all" ? ["petrol", "diesel", "cng"] : [fuelFilter];

  return (
    <div className="overflow-hidden rounded-[8px] border border-border bg-surface shadow-[0_26px_70px_-60px_rgba(17,24,39,0.55)]">
      <div className="grid gap-3 border-b border-border p-5 sm:grid-cols-[minmax(0,1fr)_150px_170px] sm:p-6">
        <label className="flex min-h-11 items-center gap-2 rounded-[6px] border border-border bg-surface px-3 focus-within:border-faint">
          <SearchIcon className="size-4 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search city in ${stateName}`}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-ink placeholder:text-subtle"
          />
        </label>
        <select
          aria-label="Filter by fuel"
          value={fuelFilter}
          onChange={(event) => setFuelFilter(event.target.value as "all" | FuelName)}
          className="min-h-11 rounded-[6px] border border-border bg-surface px-3 text-[12px] font-semibold text-ink"
        >
          <option value="all">All fuels</option>
          <option value="petrol">Petrol</option>
          <option value="diesel">Diesel</option>
          <option value="cng">CNG</option>
        </select>
        <select
          aria-label="Sort cities"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value as "name" | "petrol-low")}
          className="min-h-11 rounded-[6px] border border-border bg-surface px-3 text-[12px] font-semibold text-ink"
        >
          <option value="name">Sort: City name</option>
          <option value="petrol-low">Petrol: Low to high</option>
        </select>
      </div>

      {visibleCities.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center px-6 text-center text-[13px] text-muted">
          No cities match this search.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead className="bg-page text-[10px] font-bold uppercase text-muted">
              <tr>
                <th className="px-5 py-3.5">City</th>
                {visibleFuels.map((fuel) => <th key={fuel} className="px-4 py-3.5">{fuel}</th>)}
                <th className="px-4 py-3.5">Updated</th>
                <th className="px-4 py-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {visibleCities.map((city) => {
                const updated = city.prices.petrol?.updatedOn
                  ?? city.prices.diesel?.updatedOn
                  ?? city.prices.cng?.updatedOn;
                return (
                  <tr key={city.cityId} className="hover:bg-page/60">
                    <td className="px-5 py-3.5">
                      <Link
                        href={routes.fuelPriceInCity(stateSlug, city.citySlug)}
                        className="text-[12px] font-bold text-ink no-underline hover:text-brand"
                      >
                        {city.cityName}
                      </Link>
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
                    <td className="px-4 py-3.5 text-[10px] text-muted tabular-nums">{updated ?? "—"}</td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={routes.fuelPriceInCity(stateSlug, city.citySlug)}
                        className="text-[11px] font-bold text-brand no-underline hover:text-brand-hover"
                      >
                        View prices →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border px-5 py-4 text-[10px] text-muted">
        <span>Showing {visibleCities.length} of {cities.length} cities</span>
        <span className="tabular-nums">Updated daily</span>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CompareIcon, FuelIcon, PinIcon } from "@/components/common/icons";
import type { FuelHistory, FuelName, MetroFuelPrices } from "@/features/fuel/fuel.types";
import { FUEL_LABELS, formatFuelChange, formatFuelPrice } from "@/lib/fuel";
import { routes } from "@/lib/routes";

const FUELS: FuelName[] = ["petrol", "diesel", "cng"];

function Sparkline({ history }: { history?: FuelHistory | null }) {
  const values = (history?.series ?? []).map((point) => Number(point.price)).filter(Number.isFinite);
  if (values.length < 2) return <span className="text-[11px] text-subtle">Daily updates</span>;

  const width = 132;
  const height = 34;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 0.1);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - 4 - ((value - min) / range) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg aria-label="30-day petrol trend" viewBox={`0 0 ${width} ${height}`} className="h-9 w-32 overflow-visible">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" className="text-ev" />
    </svg>
  );
}

export default function MetroFuelComparison({
  metros,
  histories,
}: {
  metros: MetroFuelPrices[];
  histories: Record<string, FuelHistory | null>;
}) {
  const [fuel, setFuel] = useState<"all" | FuelName>("all");
  const [selected, setSelected] = useState<number[]>(metros.slice(0, 2).map((metro) => metro.cityId));
  const [compared, setCompared] = useState(false);

  const lowest = useMemo(
    () =>
      Object.fromEntries(
        FUELS.map((name) => {
          const available = metros.filter((metro) => metro.prices[name]);
          const city = available.sort(
            (a, b) => Number(a.prices[name]!.price) - Number(b.prices[name]!.price),
          )[0];
          return [name, city];
        }),
      ) as Record<FuelName, MetroFuelPrices | undefined>,
    [metros],
  );

  const selectedMetros = metros.filter((metro) => selected.includes(metro.cityId));
  const monthlyDifference = useMemo(() => {
    if (selectedMetros.length < 2) return 0;
    const prices = selectedMetros
      .map((metro) => Number(metro.prices.petrol?.price))
      .filter(Number.isFinite);
    if (prices.length < 2) return 0;
    return Math.round((Math.max(...prices) - Math.min(...prices)) * 80);
  }, [selectedMetros]);

  function toggleCity(id: number) {
    setCompared(false);
    setSelected((current) => {
      if (current.includes(id)) return current.filter((cityId) => cityId !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  const visibleFuels = fuel === "all" ? FUELS : [fuel];

  return (
    <section id="metro-comparison" className="border-y border-border-soft bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-brand">Metro price check</p>
            <h2 className="mt-2 font-head text-[28px] font-extrabold leading-tight text-ink sm:text-[36px]">
              Compare fuel prices across metros
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-6 text-muted">
              See today&apos;s rate, recent movement and the monthly impact for a typical 1,200 km drive.
            </p>
          </div>

          <div className="inline-grid grid-cols-4 self-start overflow-hidden rounded-[7px] border border-border bg-surface lg:self-auto">
            {(["all", ...FUELS] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFuel(option)}
                className={`min-h-11 cursor-pointer border-r border-border px-4 text-[12px] font-bold last:border-r-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand ${fuel === option ? "bg-brand text-white" : "bg-surface text-ink hover:bg-page"}`}
              >
                {option === "all" ? "All fuels" : FUEL_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid border-y border-border-soft sm:grid-cols-3">
          {FUELS.map((name) => {
            const metro = lowest[name];
            return (
              <div key={name} className="flex items-center gap-4 border-b border-border-soft px-5 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                <span className={`flex size-10 items-center justify-center rounded-[7px] ${name === "cng" ? "bg-ev-soft text-ev" : "bg-brand-soft text-brand"}`}>
                  <FuelIcon className="size-5" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-subtle">Lowest {name}</p>
                  <p className="mt-1 text-[13px] font-bold text-ink">
                    {metro?.cityName ?? "Unavailable"}{" "}
                    <span className="tabular-nums">{formatFuelPrice(metro?.prices[name]?.price)}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 overflow-hidden rounded-[8px] border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-page text-[10px] font-bold uppercase text-muted">
                <tr>
                  <th className="w-12 px-4 py-4"><span className="sr-only">Select</span></th>
                  <th className="px-4 py-4">City</th>
                  {visibleFuels.map((name) => (
                    <th key={name} className="px-4 py-4">{FUEL_LABELS[name]}</th>
                  ))}
                  <th className="px-4 py-4">Change today</th>
                  <th className="px-4 py-4">30-day trend</th>
                  <th className="px-4 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {metros.map((metro, index) => {
                  const primaryFuel: FuelName = fuel === "all" ? "petrol" : fuel;
                  const primaryPoint = metro.prices[primaryFuel];
                  const change = formatFuelChange(primaryPoint?.change);
                  const checked = selected.includes(metro.cityId);
                  return (
                    <tr key={metro.cityId} className={`${index === 0 ? "border-l-[3px] border-l-brand bg-[#fffaf7]" : "hover:bg-page/60"}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCity(metro.cityId)}
                          aria-label={`Select ${metro.cityName} for comparison`}
                          className="size-4 accent-[#f2650f]"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <PinIcon className="size-4 text-muted" />
                          <div>
                            <p className="text-[13px] font-bold text-ink">{metro.cityName}</p>
                            {index === 0 && <p className="mt-0.5 text-[10px] font-semibold text-brand">Your city</p>}
                          </div>
                        </div>
                      </td>
                      {visibleFuels.map((name) => {
                        const point = metro.prices[name];
                        const isLowest = lowest[name]?.cityId === metro.cityId;
                        return (
                          <td key={name} className="px-4 py-4">
                            <p className="text-[14px] font-bold text-ink tabular-nums">{formatFuelPrice(point?.price)}</p>
                            {isLowest && <span className="mt-1 inline-block rounded-[3px] bg-ev-soft px-1.5 py-0.5 text-[9px] font-bold text-ev">Lowest</span>}
                          </td>
                        );
                      })}
                      <td className={`px-4 py-4 text-[12px] font-semibold tabular-nums ${change.className}`}>
                        {change.label}
                      </td>
                      <td className="px-4 py-4"><Sparkline history={histories[metro.citySlug]} /></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Link href={routes.fuelPriceInCity(metro.citySlug)} className="text-[12px] font-bold text-brand no-underline hover:text-brand-hover">
                            View city →
                          </Link>
                          <span className="flex size-8 items-center justify-center rounded-[5px] border border-border text-muted" title="Compare city">
                            <CompareIcon className="size-4" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-border bg-[#fffaf7] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 text-[11px] font-bold text-muted">Selected ({selected.length}/3)</span>
              {selectedMetros.map((metro) => (
                <button key={metro.cityId} type="button" onClick={() => toggleCity(metro.cityId)} className="min-h-9 cursor-pointer rounded-[5px] border border-border bg-surface px-3 text-[11px] font-semibold text-ink hover:border-faint">
                  {metro.cityName} ×
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="text-[11px] text-muted">
                Estimated monthly difference <strong className="ml-1 text-[15px] text-ink tabular-nums">₹{monthlyDifference.toLocaleString("en-IN")}</strong>
              </p>
              <button type="button" onClick={() => setSelected([])} className="min-h-10 cursor-pointer rounded-[6px] border border-faint px-4 text-[11px] font-bold text-ink hover:bg-page">Clear</button>
              <button type="button" disabled={selected.length < 2} onClick={() => setCompared(true)} className="min-h-10 cursor-pointer rounded-[6px] bg-brand px-5 text-[11px] font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45">
                {compared ? "Comparison ready" : "Compare selected"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

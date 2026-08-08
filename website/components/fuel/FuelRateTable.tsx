"use client";

// components/fuel/FuelRateTable.tsx
//
// The petrol/diesel/CNG-tabbed price table both CarDekho and V3Cars lead
// with, and the thing our landing page was missing: it listed places
// without ever showing what they cost. One component because the popular
// -cities and state-wise tables differ only in their rows.

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FuelName } from "@/features/fuel/fuel.types";
import { FUEL_LABELS, formatFuelChange, formatFuelPrice } from "@/lib/fuel";

export interface FuelRateRow {
  key: string;
  name: string;
  href: string;
  /** Shown under the name — the state, or the city count. */
  meta?: string;
  prices: Partial<Record<FuelName, { price: string; change?: string }>>;
}

const FUELS: FuelName[] = ["petrol", "diesel", "cng"];

export default function FuelRateTable({
  rows,
  nameHeader,
  priceNote,
  initialFuel = "petrol",
  collapseAfter,
}: {
  rows: FuelRateRow[];
  nameHeader: string;
  /** e.g. "average across the state" — sits under the price column head. */
  priceNote?: string;
  initialFuel?: FuelName;
  /** Rows shown before "show all"; omit to always show every row. */
  collapseAfter?: number;
}) {
  const [fuel, setFuel] = useState<FuelName>(initialFuel);
  const [expanded, setExpanded] = useState(false);

  // A fuel with no data anywhere gets no tab, rather than a tab that
  // opens onto a column of dashes.
  const availableFuels = useMemo(
    () => FUELS.filter((name) => rows.some((row) => row.prices[name])),
    [rows],
  );
  const activeFuel = availableFuels.includes(fuel) ? fuel : availableFuels[0] ?? "petrol";

  const priced = useMemo(
    () => rows.filter((row) => row.prices[activeFuel]),
    [rows, activeFuel],
  );
  const visible = collapseAfter && !expanded ? priced.slice(0, collapseAfter) : priced;
  const half = Math.ceil(visible.length / 2);
  const unit = activeFuel === "cng" ? "kg" : "L";

  if (rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-[8px] border border-border bg-surface shadow-[0_24px_70px_-58px_rgba(17,24,39,0.7)]">
      <div className="flex flex-col gap-3 border-b border-border bg-[#fbfaf8] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">{nameHeader}</p>
          <p className="mt-0.5 text-[12px] font-semibold text-ink">
            {priced.length.toLocaleString("en-IN")} entries with {FUEL_LABELS[activeFuel].toLowerCase()} data
          </p>
        </div>
        <div className="inline-grid grid-cols-3 overflow-hidden rounded-[6px] border border-border bg-surface" role="tablist" aria-label="Fuel type">
        {availableFuels.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={name === activeFuel}
            onClick={() => { setFuel(name); setExpanded(false); }}
            className={`relative min-h-10 cursor-pointer border-r border-border px-5 text-[12px] font-bold transition-colors last:border-r-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand ${
              name === activeFuel ? "bg-brand text-white" : "bg-surface text-muted hover:bg-page hover:text-ink"
            }`}
          >
            {FUEL_LABELS[name]}
          </button>
        ))}
        </div>
      </div>

      {/* Split across two tables on wide screens. One full-width table
          leaves a name on the far left and its price on the far right
          with a hand's width of nothing between them, and doubles how
          far a 35-row list has to be scrolled. */}
      <div className="grid lg:grid-cols-2">
        {[visible.slice(0, half), visible.slice(half)].map((chunk, column) => (
          chunk.length === 0 ? null : (
            <div key={column} className={`overflow-x-auto ${column === 1 ? "lg:border-l lg:border-border" : ""}`}>
              <table className="w-full min-w-[300px] border-collapse text-left">
                <thead className="bg-page text-[10px] font-bold uppercase tracking-[0.04em] text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-3">{nameHeader}</th>
                    <th scope="col" className="px-5 py-3 text-right">
                      Price (₹/{unit})
                      {priceNote && <span className="block font-medium normal-case text-subtle">{priceNote}</span>}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {chunk.map((row) => {
                    const point = row.prices[activeFuel]!;
                    const change = point.change === undefined ? null : formatFuelChange(point.change);
                    return (
                      <tr key={row.key} className="transition-colors hover:bg-[#fffaf7]">
                        <td className="px-5 py-3">
                          <Link
                            href={row.href}
                            className="text-[13px] font-bold text-ink no-underline transition-colors hover:text-brand"
                          >
                            {row.name}
                          </Link>
                          {row.meta && <p className="mt-0.5 text-[10.5px] text-muted">{row.meta}</p>}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <p className="text-[13.5px] font-bold text-ink tabular-nums">
                            {formatFuelPrice(point.price)}
                          </p>
                          {change && (
                            <p className={`mt-0.5 text-[10px] font-semibold ${change.className}`}>{change.label}</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ))}
      </div>

      {collapseAfter && priced.length > collapseAfter && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="w-full cursor-pointer border-t border-border bg-[#fbfaf8] py-3 text-[12px] font-bold text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
        >
          {expanded ? "Show fewer" : `Show all ${priced.length} ${nameHeader.toLowerCase()}`}
        </button>
      )}
    </div>
  );
}

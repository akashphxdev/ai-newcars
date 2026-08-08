"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { FuelName, FuelPoint } from "@/features/fuel/fuel.types";
import { FUEL_LABELS } from "@/lib/fuel";

const FUELS: FuelName[] = ["petrol", "diesel", "cng"];

export default function FuelCostEstimator({
  prices,
}: {
  prices: Partial<Record<FuelName, FuelPoint>>;
}) {
  const available = FUELS.filter((fuel) => prices[fuel]);
  const [distance, setDistance] = useState("1200");
  const [mileage, setMileage] = useState("15");
  const [fuel, setFuel] = useState<FuelName>(available[0] ?? "petrol");

  const result = useMemo(() => {
    const monthlyDistance = Number(distance);
    const vehicleMileage = Number(mileage);
    const fuelPrice = Number(prices[fuel]?.price);
    if (![monthlyDistance, vehicleMileage, fuelPrice].every(Number.isFinite) || vehicleMileage <= 0) {
      return { monthly: 0, perKm: 0 };
    }
    return {
      monthly: (monthlyDistance / vehicleMileage) * fuelPrice,
      perKm: fuelPrice / vehicleMileage,
    };
  }, [distance, fuel, mileage, prices]);

  return (
    <aside className="overflow-hidden rounded-[8px] border border-border bg-surface">
      <div className="relative aspect-[5/2] border-b border-border-soft bg-page">
        <Image src="/design/fuel-prices/fuel-gauge-banner.png" alt="Car fuel gauge" fill sizes="420px" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.96),rgba(255,255,255,0.72)_46%,rgba(255,255,255,0.05))]" />
        <h2 className="absolute left-5 top-1/2 max-w-52 -translate-y-1/2 font-head text-[20px] font-bold leading-tight text-ink">
          Estimate your monthly fuel cost
        </h2>
      </div>

      <div className="p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <label className="block">
            <span className="text-[9px] font-semibold text-muted">Monthly distance</span>
            <div className="mt-1 flex min-h-11 items-center rounded-[6px] border border-border px-3 focus-within:border-faint">
              <input value={distance} onChange={(event) => setDistance(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" className="min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-ink tabular-nums" />
              <span className="text-[10px] text-muted">km</span>
            </div>
          </label>
          <label className="block">
            <span className="text-[9px] font-semibold text-muted">Vehicle mileage</span>
            <div className="mt-1 flex min-h-11 items-center rounded-[6px] border border-border px-3 focus-within:border-faint">
              <input value={mileage} onChange={(event) => setMileage(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" className="min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-ink tabular-nums" />
              <span className="text-[10px] text-muted">km/L</span>
            </div>
          </label>
        </div>

        <label className="mt-3 block">
          <span className="text-[9px] font-semibold text-muted">Fuel type</span>
          <select value={fuel} onChange={(event) => setFuel(event.target.value as FuelName)} className="mt-1 min-h-11 w-full rounded-[6px] border border-border bg-surface px-3 text-[12px] font-semibold text-ink">
            {available.map((name) => <option key={name} value={name}>{FUEL_LABELS[name]}</option>)}
          </select>
        </label>

        <div className="mt-5 border-y border-border-soft py-4">
          <p className="text-[9px] font-semibold uppercase text-muted">Estimated monthly spend</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="font-head text-[33px] font-extrabold leading-none text-ink tabular-nums">
              ₹{Math.round(result.monthly).toLocaleString("en-IN")}
            </p>
            <p className="pb-1 text-[10px] text-muted tabular-nums">≈ ₹{result.perKm.toFixed(2)} per km</p>
          </div>
        </div>

        <Link href="/mileage-calculator" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-[6px] bg-brand px-4 text-[11px] font-bold text-white no-underline transition-colors hover:bg-brand-hover">
          Open full fuel cost calculator →
        </Link>
        <Link href="/fuel-comparison-calculator" className="mt-3 block text-center text-[10px] font-bold text-brand no-underline hover:text-brand-hover">
          Compare petrol, diesel, CNG and EV
        </Link>
      </div>
    </aside>
  );
}

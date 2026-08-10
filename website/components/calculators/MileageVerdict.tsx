// components/calculators/MileageVerdict.tsx
//
// The page reports cost per km, per day, per month and per year — four
// framings of one number, none of which is the figure that changes a
// decision. That figure is what the fuel costs across the years someone
// actually keeps the car, set against what the car cost.
//
// The second half answers the question the mileage field invites but the
// page never addresses: what is one more kilometre per litre worth?

"use client";

import { formatRupee } from "@/lib/calculatorFormat";

const OWNERSHIP_YEARS = 5;

export default function MileageVerdict({
  yearlyCost,
  mileage,
  fuelPrice,
  monthlyDistanceKm,
  carPrice,
  unitLabel,
}: {
  yearlyCost: number;
  mileage: number;
  fuelPrice: number;
  monthlyDistanceKm: number;
  carPrice: number | null;
  unitLabel: string;
}) {
  if (yearlyCost <= 0 || mileage <= 0) return null;

  const fiveYear = yearlyCost * OWNERSHIP_YEARS;
  const shareOfCar = carPrice && carPrice > 0 ? (fiveYear / carPrice) * 100 : null;

  // What one more unit of efficiency is worth, at this driving and price.
  // Held at the same distance, so it isolates the efficiency alone.
  const yearlyKm = monthlyDistanceKm * 12;
  const costAtPlusOne = yearlyKm > 0 ? (yearlyKm / (mileage + 1)) * fuelPrice : 0;
  const perUnitSaving = costAtPlusOne > 0 ? yearlyCost - costAtPlusOne : 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-[13.5px] font-bold text-ink">What the fuel adds up to</h3>

      <div className="mt-3 rounded-xl bg-page p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Fuel over {OWNERSHIP_YEARS} years
        </p>
        <p className="mt-1 font-head text-[24px] font-extrabold leading-none text-ink tabular-nums">
          {formatRupee(fiveYear)}
        </p>
        {shareOfCar !== null && (
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
            That is{" "}
            <span className="font-semibold text-ink">{shareOfCar.toFixed(0)}%</span> of what the car
            itself costs — spent again, quietly, a tank at a time.
          </p>
        )}
      </div>

      {perUnitSaving > 0 && (
        <p className="mt-3.5 text-[12.5px] leading-relaxed text-muted">
          Every extra <span className="font-semibold text-ink">1 {unitLabel}</span> this car
          returns saves about{" "}
          <span className="font-semibold text-ink">{formatRupee(perUnitSaving)}</span> a year at
          this driving — worth remembering when a variant trades efficiency for power.
        </p>
      )}

      <p className="mt-3 text-[10.5px] leading-relaxed text-subtle">
        Assumes today&apos;s fuel price holds and you keep driving{" "}
        {monthlyDistanceKm.toLocaleString("en-IN")} km a month. Fuel prices move, so treat this as
        the shape of the cost rather than a quote.
      </p>
    </div>
  );
}

// components/cars/RunningCostStrip.tsx
//
// What the car costs to drive, in rupees, on today's pump price.
//
// The page quotes mileage as a bare figure — 17.44 kmpl means nothing to
// most readers until it is money. This turns it into cost per kilometre
// and a monthly bill, priced in four metros because fuel is not one
// national number: the same car costs noticeably more to run in Mumbai
// than in Delhi.
//
// Petrol, diesel and CNG only. An EV's running cost needs an electricity
// tariff, and we hold none — a made-up rate would read as fact.

import Link from "next/link";
import { calculateRunningCost } from "@/lib/mileageMath";
import { formatRupee } from "@/lib/calculatorFormat";
import { routes } from "@/lib/routes";
import type { CarDetailSelectedVariant } from "@/features/cars/car.types";
import type { MetroFuelPrices, FuelName } from "@/features/fuel/fuel.types";

const ASSUMED_MONTHLY_KM = 1000;

const FUEL_NAMES: Record<string, FuelName> = { petrol: "petrol", diesel: "diesel", cng: "cng" };

// CNG is sold by the kilogram, so its mileage is not kmpl and its per-unit
// price is not per litre.
const UNIT: Record<FuelName, { mileage: string; price: string }> = {
  petrol: { mileage: "kmpl", price: "litre" },
  diesel: { mileage: "kmpl", price: "litre" },
  cng: { mileage: "km/kg", price: "kg" },
};

function Figure({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-page p-4">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-[22px] font-black leading-none text-ink tabular-nums">{value}</p>
      <p className="mt-1.5 text-[11px] text-subtle">{note}</p>
    </div>
  );
}

export default function RunningCostStrip({
  variant,
  carName,
  metros,
}: {
  variant: CarDetailSelectedVariant;
  carName: string;
  metros: MetroFuelPrices[];
}) {
  const ice = variant.ice;
  if (variant.isElectric || !ice) return null;

  const fuel = FUEL_NAMES[(ice.fuelType ?? "").trim().toLowerCase()];
  if (!fuel) return null;

  // The tested figure when we hold one, the manufacturer's claim otherwise —
  // and the card has to say which, because they differ by a good margin.
  const tested = Number(ice.realWorldMileage);
  const mileage = tested > 0 ? tested : Number(ice.claimedFe);
  const isTested = tested > 0;
  if (!(mileage > 0)) return null;

  const priced = metros
    .map((m) => ({ city: m.cityName, price: Number(m.prices[fuel]?.price) }))
    .filter((m) => m.price > 0)
    .slice(0, 4);
  if (!priced.length) return null;

  const cheapest = priced.reduce((a, b) => (a.price <= b.price ? a : b));
  const lead = calculateRunningCost(cheapest.price, mileage, ASSUMED_MONTHLY_KM);
  const unit = UNIT[fuel];

  return (
    <div className="mt-8">
      {/* The heading belongs to the strip, not the page — cars we hold no
          mileage figure for otherwise get a title over an empty space. */}
      <p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-brand">Running cost</p>
      <h3 className="mt-2 font-head text-2xl font-extrabold text-ink">
        What the {carName} costs to drive
      </h3>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid gap-px bg-border-soft sm:grid-cols-3">
          <Figure label="Per kilometre" value={formatRupee(lead.costPerKm)} note={`In ${cheapest.city}`} />
          <Figure label="A month" value={formatRupee(lead.monthlyCost)} note={`At ${ASSUMED_MONTHLY_KM} km`} />
          <Figure label="A year" value={formatRupee(lead.yearlyCost)} note="Fuel alone" />
        </div>

        <div className="p-4">
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted">A month elsewhere</p>
          <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
            {priced.map((m) => {
              const cost = calculateRunningCost(m.price, mileage, ASSUMED_MONTHLY_KM);
              return (
                <li
                  key={m.city}
                  className="flex items-baseline justify-between gap-3 rounded-lg bg-page px-3 py-2"
                >
                  <span className="min-w-0 truncate text-[12.5px] font-semibold text-ink">{m.city}</span>
                  <span className="shrink-0 text-[12.5px] text-muted tabular-nums">
                    ₹{m.price.toFixed(2)}/{unit.price} ·{" "}
                    <span className="font-bold text-ink">{formatRupee(cost.monthlyCost)}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-3.5 text-[11px] leading-relaxed text-subtle">
            On {mileage} {unit.mileage} —{" "}
            {isTested ? "our tested figure" : "the claimed figure, which real driving rarely matches"}
            {" — "}
            and today&apos;s pump price. Fuel only: no servicing, tyres, insurance or parking.{" "}
            <Link
              href={routes.mileageCalculator()}
              className="font-bold text-brand no-underline hover:text-brand-hover"
            >
              Use your own mileage and distance →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

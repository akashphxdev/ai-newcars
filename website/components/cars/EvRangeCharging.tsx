// components/cars/EvRangeCharging.tsx
//
// Section 5 of the v2 model page: what an EV's range actually means, what
// filling it costs, and how that compares with petrol.
//
// Every figure here is derived and every assumption is on screen and
// editable. The claimed range is the manufacturer's; the real-world number
// is our estimate and says so. The petrol comparison uses the live pump
// price for the reader's own city rather than a national average, because
// we hold those and a hardcoded figure would be wrong the day it shipped.

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BoltIcon, FuelIcon, ClockIcon } from "@/components/common/icons";
import { getFuelPricesForCity } from "@/features/fuel/fuel.api";
import { CITY_EVENT, getCurrentCity } from "@/features/location/currentCity";
import type { LocationCity } from "@/features/location/location.types";
import type { CarDetailSelectedVariant } from "@/features/cars/car.types";
import { formatRupee } from "@/lib/calculatorFormat";

// The same ratio the API applies to EV range elsewhere. Consistency across
// the site matters more than matching any one published figure — a car
// that claims 226 km should not show two different estimates on two pages.
const ARAI_TO_REAL_WORLD = 0.7;

// Domestic slab rates vary by state and consumption; this is a starting
// point the reader can change, not a number we assert.
const DEFAULT_UNIT_COST = 8;
// A hatchback's rated figure, used only until the reader gives their own.
const DEFAULT_PETROL_KMPL = 20;

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-1 font-head text-[20px] font-extrabold leading-none text-ink">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-muted">{sub}</p>}
    </div>
  );
}

export default function EvRangeCharging({
  variant,
  modelName,
}: {
  variant: CarDetailSelectedVariant;
  modelName: string;
}) {
  const e = variant.electric;
  const [city, setCity] = useState<LocationCity | null>(null);
  const [petrolPrice, setPetrolPrice] = useState<number | null>(null);
  const [unitCost, setUnitCost] = useState(DEFAULT_UNIT_COST);
  const [monthlyKm, setMonthlyKm] = useState(1200);
  const [petrolKmpl, setPetrolKmpl] = useState(DEFAULT_PETROL_KMPL);

  useEffect(() => {
    setCity(getCurrentCity());
    const sync = (ev: Event) => setCity((ev as CustomEvent<LocationCity>).detail);
    window.addEventListener(CITY_EVENT, sync);
    return () => window.removeEventListener(CITY_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!city?.slug || !city.stateSlug) return;
    let alive = true;
    getFuelPricesForCity(city.stateSlug, city.slug)
      .then((r) => {
        const p = r?.prices?.petrol?.price;
        if (alive && p) setPetrolPrice(Number(p));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [city?.slug, city?.stateSlug]);

  const figures = useMemo(() => {
    const battery = e?.batteryCapacity ? Number(e.batteryCapacity) : 0;
    const claimed = e?.claimedRange ?? 0;
    const realWorld = e?.realWorldRange ?? Math.round(claimed * ARAI_TO_REAL_WORLD);
    // Efficiency from the estimate rather than the claim: it is what the
    // running cost should be based on.
    const kmPerKwh = battery > 0 && realWorld > 0 ? realWorld / battery : 0;
    const costPerKm = kmPerKwh > 0 ? unitCost / kmPerKwh : 0;
    const fullChargeCost = battery * unitCost;
    const monthlyCost = costPerKm * monthlyKm;

    const petrol = petrolPrice ?? 0;
    const petrolPerKm = petrol > 0 && petrolKmpl > 0 ? petrol / petrolKmpl : 0;
    const petrolMonthly = petrolPerKm * monthlyKm;

    return {
      battery,
      claimed,
      realWorld,
      kmPerKwh,
      costPerKm,
      fullChargeCost,
      monthlyCost,
      petrolPerKm,
      petrolMonthly,
      yearlySaving: (petrolMonthly - monthlyCost) * 12,
    };
  }, [e, unitCost, monthlyKm, petrolPrice, petrolKmpl]);

  if (!e || !figures.battery) return null;

  const realWorldIsEstimate = !e.realWorldRange;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Stat
              label="Claimed range"
              value={`${figures.claimed} km`}
              sub="Manufacturer figure"
            />
            <div className="hidden h-px flex-1 bg-border-soft sm:block" />
            <Stat
              label={realWorldIsEstimate ? "Real-world (est.)" : "Real-world range"}
              value={`${figures.realWorld} km`}
              sub={
                realWorldIsEstimate
                  ? `Our estimate at ${Math.round(ARAI_TO_REAL_WORLD * 100)}% of claimed`
                  : "Measured"
              }
            />
          </div>
          {realWorldIsEstimate && (
            <p className="mt-3 border-t border-border-soft pt-3 text-[11px] leading-relaxed text-subtle">
              Claimed range is measured under test conditions. Real driving — air-conditioning,
              traffic, motorway speeds — takes a consistent bite out of it, so we show an estimate
              rather than repeat a number nobody achieves.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-page text-brand">
              <ClockIcon className="size-4" />
            </span>
            <p className="mt-3 text-[13px] font-bold text-ink">Home charging</p>
            <p className="text-[11px] text-muted">
              {e.acChargingOutput ? `AC ${e.acChargingOutput} kW` : "AC"}
            </p>
            <p className="mt-3 font-head text-[19px] font-extrabold leading-none text-ink">
              {e.acChargingTime ? `${e.acChargingTime} h` : "—"}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              {formatRupee(figures.fullChargeCost)} a full charge
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-page text-brand">
              <BoltIcon className="size-4" />
            </span>
            <p className="mt-3 text-[13px] font-bold text-ink">Fast charging</p>
            <p className="text-[11px] text-muted">
              {e.dcChargingOutput ? `DC ${e.dcChargingOutput} kW` : "DC"}
              {e.chargingPort ? ` · ${e.chargingPort}` : ""}
            </p>
            <p className="mt-3 font-head text-[19px] font-extrabold leading-none text-ink">
              {e.dcFastChargingTime ?? "—"}
            </p>
            <p className="mt-1 text-[11px] text-muted">Manufacturer&apos;s own charge window</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-page text-brand">
              <FuelIcon className="size-4" />
            </span>
            <p className="mt-3 text-[13px] font-bold text-ink">Running cost</p>
            <p className="text-[11px] text-muted">At {monthlyKm.toLocaleString("en-IN")} km/month</p>
            <p className="mt-3 font-head text-[19px] font-extrabold leading-none text-ink">
              {formatRupee(figures.costPerKm)}
              <span className="text-[12px] font-semibold text-muted">/km</span>
            </p>
            <p className="mt-1 text-[11px] text-muted">
              {formatRupee(figures.monthlyCost)} a month
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-[13px] font-bold text-ink">Work out your own</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Change any of these and every figure above follows.
        </p>

        <div className="mt-4 space-y-3">
          {[
            { label: "Monthly distance", unit: "km", value: monthlyKm, set: setMonthlyKm },
            { label: "Electricity", unit: "₹/unit", value: unitCost, set: setUnitCost },
            { label: "Petrol car mileage", unit: "kmpl", value: petrolKmpl, set: setPetrolKmpl },
          ].map((f) => (
            <label key={f.label} className="block">
              <span className="mb-1 flex items-baseline justify-between text-[11.5px] text-muted">
                {f.label}
                <span className="text-[10.5px] text-subtle">{f.unit}</span>
              </span>
              <input
                type="number"
                min={0}
                value={f.value}
                onChange={(ev) => f.set(Math.max(0, Number(ev.target.value) || 0))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] font-semibold text-ink outline-none focus:border-brand"
              />
            </label>
          ))}
        </div>

        <div className="mt-4 border-t border-border-soft pt-3">
          {petrolPrice ? (
            <>
              <p className="text-[11.5px] text-muted">
                Petrol in {city?.name} is {formatRupee(petrolPrice)}/litre today
              </p>
              <p className="mt-2 text-[12.5px] text-muted">
                A petrol car at {petrolKmpl} kmpl costs{" "}
                <span className="font-semibold text-ink">{formatRupee(figures.petrolMonthly)}</span> a
                month over the same distance.
              </p>
              {figures.yearlySaving > 0 && (
                <p className="mt-2 font-head text-[17px] font-extrabold leading-tight text-ink">
                  {formatRupee(figures.yearlySaving)}
                  <span className="ml-1 text-[12px] font-semibold text-muted">saved a year</span>
                </p>
              )}
            </>
          ) : (
            <p className="text-[11.5px] leading-relaxed text-muted">
              Pick your city in the header and we&apos;ll compare this against today&apos;s actual
              pump price there.
            </p>
          )}
        </div>

        <Link
          href="/ev-charging-time-calculator"
          className="mt-4 block rounded-lg border border-brand px-4 py-2.5 text-center text-[12.5px] font-bold text-brand no-underline transition-colors hover:bg-brand-soft"
        >
          Charging time calculator
        </Link>
        <p className="mt-3 text-[10.5px] leading-relaxed text-subtle">
          Electricity and fuel costs are estimates. Charging losses, tariff slabs and driving style
          all move the real figure.
        </p>
      </div>
    </div>
  );
}

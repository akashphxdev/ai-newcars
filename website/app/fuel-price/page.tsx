import type { Metadata } from "next";
import Link from "next/link";
import FuelPriceTable from "@/components/fuel/FuelPriceTable";
import { getFuelStates, getMetroFuelPrices } from "@/features/fuel/fuel.api";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Petrol, Diesel & CNG Prices in India Today | TimesAuto",
  description:
    "Today's petrol, diesel and CNG prices across Indian cities, updated daily — with the day's change and city-wise rates for every state.",
};

export const revalidate = 3600;

export default async function FuelPricePage() {
  const [metros, states] = await Promise.all([getMetroFuelPrices(), getFuelStates()]);
  const asOf = metros[0]?.prices.petrol?.updatedOn;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">Fuel Prices in India Today</h1>
      <p className="mt-2 text-sm text-muted">
        Petrol, diesel and CNG rates across {states.reduce((n, s) => n + s.cityCount, 0)} cities
        {asOf && ` · updated ${asOf}`}
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-ink">Metro cities</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {metros.map((m) => (
            <div key={m.cityId}>
              <Link
                href={routes.fuelPriceInCity(m.citySlug)}
                className="text-[15px] font-bold text-ink no-underline hover:text-brand"
              >
                {m.cityName}
              </Link>
              <div className="mt-2">
                <FuelPriceTable prices={m.prices} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-bold text-ink">By state</h2>
        <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
          {states.map((s) => (
            <li key={s.id} className="flex items-baseline justify-between border-b border-border-soft py-2">
              <span className="text-[13px] font-semibold text-ink">{s.name}</span>
              <span className="text-[11px] text-muted tabular-nums">{s.cityCount}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

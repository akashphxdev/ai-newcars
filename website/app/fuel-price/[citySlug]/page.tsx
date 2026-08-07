import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FuelPriceTable from "@/components/fuel/FuelPriceTable";
import { getFuelHistory, getFuelPricesForCity } from "@/features/fuel/fuel.api";
import { formatFuelPrice } from "@/lib/fuel";

type Props = { params: Promise<{ citySlug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { citySlug } = await params;
  const data = await getFuelPricesForCity(citySlug);
  if (!data) return { title: "Fuel Price | TimesAuto" };
  const petrol = data.prices.petrol ? ` — petrol ${formatFuelPrice(data.prices.petrol.price)}` : "";
  return {
    title: `Petrol, Diesel & CNG Price in ${data.city.name} Today | TimesAuto`,
    description: `Today's fuel prices in ${data.city.name}, ${data.state.name}${petrol}. Updated daily with the day's change and a 30-day trend.`,
  };
}

export default async function FuelPriceCityPage({ params }: Props) {
  const { citySlug } = await params;
  const data = await getFuelPricesForCity(citySlug);
  if (!data) notFound();

  const history = await getFuelHistory(citySlug, 1, 30);
  // Only days the price actually moved — a 30-row table of "no change"
  // is noise, and the moves are the whole reason to look.
  const moves = (history?.series ?? []).filter((d) => Number(d.change) !== 0).slice(0, 10);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">
        Fuel Price in {data.city.name} Today
      </h1>
      <p className="mt-2 text-sm text-muted">
        {data.state.name}
        {data.prices.petrol && ` · updated ${data.prices.petrol.updatedOn}`}
      </p>

      <div className="mt-6">
        <FuelPriceTable prices={data.prices} />
      </div>

      {moves.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-ink">Recent petrol price changes</h2>
          <ul className="mt-3 max-w-md">
            {moves.map((d) => {
              const n = Number(d.change);
              return (
                <li
                  key={d.day}
                  className="flex items-center justify-between border-b border-border-soft py-2 text-[13px]"
                >
                  <span className="text-muted tabular-nums">{d.day}</span>
                  <span className="font-semibold text-ink tabular-nums">{formatFuelPrice(d.price)}</span>
                  <span className={`font-semibold tabular-nums ${n > 0 ? "text-danger" : "text-ev"}`}>
                    {n > 0 ? "+" : "−"}₹{Math.abs(n).toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

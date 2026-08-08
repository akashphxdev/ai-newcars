import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PinIcon, ShieldIcon } from "@/components/common/icons";
import FuelCityActions from "@/components/fuel/FuelCityActions";
import FuelCostEstimator from "@/components/fuel/FuelCostEstimator";
import FuelDetailCard from "@/components/fuel/FuelDetailCard";
import FuelHistoryChart from "@/components/fuel/FuelHistoryChart";
import { getFuelHistory, getFuelPricesForCity } from "@/features/fuel/fuel.api";
import type { FuelName } from "@/features/fuel/fuel.types";
import { formatFuelPrice } from "@/lib/fuel";
import { routes } from "@/lib/routes";

type Props = { params: Promise<{ citySlug: string }> };

const FUEL_IDS: Record<FuelName, number> = { petrol: 1, diesel: 2, cng: 3 };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { citySlug } = await params;
  const data = await getFuelPricesForCity(citySlug);
  if (!data) return { title: "Fuel Price | TimesAuto" };
  const petrol = data.prices.petrol ? ` — petrol ${formatFuelPrice(data.prices.petrol.price)}` : "";
  return {
    title: `Petrol, Diesel & CNG Price in ${data.city.name} Today | TimesAuto`,
    description: `Today's fuel prices in ${data.city.name}, ${data.state.name}${petrol}. Updated daily with 30-day trends and an estimated monthly fuel cost.`,
  };
}

export default async function FuelPriceCityPage({ params }: Props) {
  const { citySlug } = await params;
  const data = await getFuelPricesForCity(citySlug);
  if (!data) notFound();

  const historyEntries = await Promise.all(
    (Object.keys(FUEL_IDS) as FuelName[]).map(async (fuel) => [
      fuel,
      await getFuelHistory(citySlug, FUEL_IDS[fuel], 30),
    ] as const),
  );
  const histories = Object.fromEntries(historyEntries);
  const asOf = data.prices.petrol?.updatedOn ?? data.prices.diesel?.updatedOn ?? data.prices.cng?.updatedOn;

  return (
    <main className="bg-page">
      <section className="border-b border-border-soft bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[10px] text-muted">
            <Link href={routes.fuelPrice()} className="text-muted no-underline hover:text-brand">India</Link>
            <span>/</span>
            <Link href={`${routes.fuelPrice()}?state=${data.state.id}#state-directory`} className="text-muted no-underline hover:text-brand">{data.state.name}</Link>
            <span>/</span>
            <span className="font-semibold text-ink">{data.city.name}</span>
          </nav>

          <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase text-brand">City price detail</p>
              <h1 className="mt-2 font-head text-[34px] font-extrabold leading-tight text-ink sm:text-[44px]">
                Fuel prices in {data.city.name}
              </h1>
              <p className="mt-3 text-[13px] text-muted">Current retail rates, recent movement and estimated monthly cost.</p>
              <p className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-muted">
                <span className="size-2 rounded-full bg-ev" /> Updated {asOf ?? "daily at 6:00 AM"}
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <FuelCityActions city={data.city.name} state={data.state.name} prices={data.prices} />
              <Link href={`${routes.fuelPrice()}#city-search`} className="flex min-h-11 min-w-64 items-center gap-3 rounded-[6px] border border-border bg-surface px-4 text-[11px] font-bold text-ink no-underline hover:bg-page">
                <PinIcon className="size-4" />
                <span className="min-w-0 flex-1 truncate">{data.city.name}</span>
                <span className="text-muted">Change city</span>
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {(["petrol", "diesel", "cng"] as FuelName[]).map((fuel) => {
              const point = data.prices[fuel];
              if (!point) return null;
              return <FuelDetailCard key={fuel} fuel={fuel} point={point} history={histories[fuel]} />;
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)] sm:py-16">
        <FuelHistoryChart histories={histories} cityName={data.city.name} />
        <FuelCostEstimator prices={data.prices} />
      </section>

      <div className="border-y border-border-soft bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="flex max-w-3xl items-start gap-2 leading-5">
            <ShieldIcon className="mt-0.5 size-4 shrink-0" />
            Prices are sourced from public oil-marketing updates and local dealer reports. Actual pump prices may vary slightly.
          </p>
          <div className="flex gap-5">
            <Link href={routes.fuelPrice()} className="font-semibold text-ink no-underline hover:text-brand">Methodology</Link>
            <a href="mailto:support@timesauto.net" className="font-semibold text-ink no-underline hover:text-brand">Report an incorrect price</a>
          </div>
        </div>
      </div>
    </main>
  );
}

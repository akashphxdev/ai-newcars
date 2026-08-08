import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/common/JsonLd";
import { ShieldIcon } from "@/components/common/icons";
import FuelCityActions from "@/components/fuel/FuelCityActions";
import FuelCitySearch from "@/components/fuel/FuelCitySearch";
import FuelCostEstimator from "@/components/fuel/FuelCostEstimator";
import FuelDetailCard from "@/components/fuel/FuelDetailCard";
import FuelFaq from "@/components/fuel/FuelFaq";
import FuelHistoryChart from "@/components/fuel/FuelHistoryChart";
import FuelNearbyCities from "@/components/fuel/FuelNearbyCities";
import FuelPriceContext from "@/components/fuel/FuelPriceContext";
import {
  getFuelCityContext, getFuelHistory, getFuelPricesForCity, getFuelState,
} from "@/features/fuel/fuel.api";
import { FUEL_TYPE_IDS, type FuelName } from "@/features/fuel/fuel.types";
import { formatFuelDate, formatFuelPrice, mergeCityRows } from "@/lib/fuel";
import { routes } from "@/lib/routes";
import { breadcrumbJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ stateSlug: string; citySlug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug, citySlug } = await params;
  const data = await getFuelPricesForCity(stateSlug, citySlug);
  if (!data) return { title: "Fuel Price | TimesAuto" };

  const canonical = routes.fuelPriceInCity(data.state.slug, data.city.slug);
  // The rate itself belongs in the description — it is what the snippet
  // is competing on, and it changes daily, which keeps the page fresh.
  const rates = [
    data.prices.petrol && `petrol ${formatFuelPrice(data.prices.petrol.price)}/L`,
    data.prices.diesel && `diesel ${formatFuelPrice(data.prices.diesel.price)}/L`,
    data.prices.cng && `CNG ${formatFuelPrice(data.prices.cng.price)}/kg`,
  ].filter(Boolean).join(", ");
  const title = `Petrol, Diesel & CNG Price in ${data.city.name} Today | TimesAuto`;
  const description = `Fuel prices in ${data.city.name}, ${data.state.name} today${rates ? ` — ${rates}` : ""}. Updated daily at 6 AM with 30-day trends and a monthly running-cost estimate.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}

export default async function FuelPriceCityPage({ params }: Props) {
  const { stateSlug, citySlug } = await params;
  const data = await getFuelPricesForCity(stateSlug, citySlug);
  if (!data) notFound();

  // Independent of one another and of the city fetch above, so they all
  // overlap rather than stacking five round trips.
  const [histories, context, stateDetail] = await Promise.all([
    Promise.all(
      (["petrol", "diesel", "cng"] as FuelName[]).map(async (fuel) => [
        fuel, await getFuelHistory(stateSlug, citySlug, FUEL_TYPE_IDS[fuel], 30),
      ] as const),
    ).then(Object.fromEntries),
    getFuelCityContext(stateSlug, citySlug),
    getFuelState(stateSlug),
  ]);

  const asOf = data.prices.petrol?.updatedOn ?? data.prices.diesel?.updatedOn ?? data.prices.cng?.updatedOn;
  const asOfLabel = formatFuelDate(asOf);
  const stateCities = mergeCityRows({ petrol: stateDetail?.cities });

  const crumbs = [
    { name: "Fuel prices in India", href: routes.fuelPrice() },
    { name: data.state.name, href: routes.fuelPriceInState(data.state.slug) },
    { name: data.city.name },
  ];

  return (
    <main className="bg-page">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <section className="border-b border-border-soft bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[10px] text-muted">
            {crumbs.map((crumb, index) => (
              <span key={crumb.name} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden>/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="text-muted no-underline hover:text-brand">
                    {index === 0 ? "India" : crumb.name}
                  </Link>
                ) : (
                  <span className="font-semibold text-ink">{crumb.name}</span>
                )}
              </span>
            ))}
          </nav>

          <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div>
              <p className="text-[11px] font-bold uppercase text-brand">City price detail</p>
              <h1 className="mt-2 font-head text-[34px] font-extrabold leading-[1.06] text-ink sm:text-[44px]">
                Petrol, diesel &amp; CNG price in {data.city.name} today
                {asOfLabel && (
                  <span className="mt-1 block text-[20px] font-bold text-muted sm:text-[24px]">
                    {asOfLabel}
                  </span>
                )}
              </h1>
              <p className="mt-3 max-w-xl text-[13px] leading-6 text-muted">
                Today&apos;s retail pump rates for {data.city.name}, {data.state.name}, with the last
                30 days of movement and an estimate of what they cost you each month.
              </p>
              <p className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-muted">
                <span className="size-2 rounded-full bg-ev" /> Rates revised daily at 6:00 AM
              </p>
              <div className="mt-6">
                <FuelCityActions city={data.city.name} state={data.state.name} prices={data.prices} />
              </div>
            </div>

            {/* A working search, not a link back to the landing page —
                changing city is the single most common thing a visitor
                wants from here. */}
            <div className="lg:pt-8">
              <p className="mb-2 text-[11px] font-bold uppercase text-muted">Check another city</p>
              <FuelCitySearch placeholder={`Not in ${data.city.name}? Search your city`} />
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

      <FuelPriceContext
        cityName={data.city.name}
        stateName={data.state.name}
        prices={data.prices}
        context={context}
      />

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-12 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)] sm:pb-16">
        <FuelHistoryChart histories={histories} cityName={data.city.name} />
        <FuelCostEstimator prices={data.prices} />
      </section>

      <FuelNearbyCities
        stateSlug={data.state.slug}
        stateName={data.state.name}
        currentSlug={data.city.slug}
        cities={stateCities}
      />

      <FuelFaq
        scope={{
          place: data.city.name,
          state: data.state.name,
          petrol: data.prices.petrol?.price,
          diesel: data.prices.diesel?.price,
          cng: data.prices.cng?.price,
        }}
      />

      <div className="border-y border-border-soft bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="flex max-w-3xl items-start gap-2 leading-5">
            <ShieldIcon className="mt-0.5 size-4 shrink-0" />
            Prices are sourced from public oil-marketing updates and local dealer reports. Actual pump prices may vary slightly.
          </p>
          <div className="flex gap-5">
            <Link href={routes.fuelPrice()} className="font-semibold text-ink no-underline hover:text-brand">All India prices</Link>
            <a href="mailto:support@timesauto.net" className="font-semibold text-ink no-underline hover:text-brand">Report an incorrect price</a>
          </div>
        </div>
      </div>
    </main>
  );
}

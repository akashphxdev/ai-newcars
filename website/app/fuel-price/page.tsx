import type { Metadata } from "next";
import PageSidebar from "@/components/common/PageSidebar";
import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/common/JsonLd";
import { BellIcon, PinIcon, ShieldIcon } from "@/components/common/icons";
import FuelCitySearch from "@/components/fuel/FuelCitySearch";
import FuelFaq from "@/components/fuel/FuelFaq";
import FuelPopularCities from "@/components/fuel/FuelPopularCities";
import FuelStateCityPicker from "@/components/fuel/FuelStateCityPicker";
import FuelStateDirectory from "@/components/fuel/FuelStateDirectory";
import FuelSummaryCard from "@/components/fuel/FuelSummaryCard";
import MetroFuelComparison from "@/components/fuel/MetroFuelComparison";
import {
  getFuelHistory,
  getFuelStatePrices,
  getFuelStates,
  getMetroFuelPrices,
  getPopularCityFuelPrices,
} from "@/features/fuel/fuel.api";
import type { FuelName } from "@/features/fuel/fuel.types";
import { formatFuelDate } from "@/lib/fuel";
import { routes } from "@/lib/routes";
import { breadcrumbJsonLd } from "@/lib/seo";

const TITLE = "Petrol, Diesel & CNG Price in India Today | TimesAuto";
const DESCRIPTION =
  "Today's petrol, diesel and CNG prices across Indian cities and states, updated daily at 6 AM. Compare rates city-wise and state-wise, with 30-day trends and monthly running-cost estimates.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: routes.fuelPrice() },
  openGraph: { title: TITLE, description: DESCRIPTION, url: routes.fuelPrice(), type: "website" },
};

export const revalidate = 3600;

export default async function FuelPricePage() {
  const [metros, states, statePrices, popular] = await Promise.all([
    getMetroFuelPrices(),
    getFuelStates(),
    getFuelStatePrices(),
    getPopularCityFuelPrices(),
  ]);

  const histories = Object.fromEntries(
    await Promise.all(metros.map(async (metro) => [
      metro.citySlug, await getFuelHistory(metro.stateSlug, metro.citySlug, 1, 30),
    ] as const)),
  );

  const featured = metros[0];
  const totalCities = statePrices.reduce((total, state) => total + state.cityCount, 0)
    || states.reduce((total, state) => total + state.cityCount, 0);
  const asOf = featured?.prices.petrol?.updatedOn ?? featured?.prices.diesel?.updatedOn;
  const asOfLabel = formatFuelDate(asOf);

  return (
    <main className="max-w-[100vw] overflow-x-hidden bg-page">
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", href: routes.home() },
        { name: "Fuel prices in India" },
      ])} />

      <section className="relative overflow-hidden border-b border-border bg-[#fbfaf8]">
        <Image
          src="/design/fuel-prices/hero-nozzle.png"
          alt="Orange petrol nozzle filling a silver car"
          fill
          priority
          sizes="100vw"
          className="pointer-events-none object-cover object-[64%_center] opacity-30 sm:opacity-45 lg:object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#fbfaf8_0%,rgba(251,250,248,0.97)_30%,rgba(251,250,248,0.74)_56%,rgba(251,250,248,0.16)_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(#cfd3da_1px,transparent_1px),linear-gradient(90deg,#cfd3da_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:pb-14 sm:pt-10 lg:min-h-[520px]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] text-muted">
            <Link href={routes.home()} className="text-muted no-underline hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-ink">Fuel prices</span>
          </nav>

          <div className="mt-9 max-w-[720px]">
            <div className="relative z-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-brand">Daily fuel watch</p>
              {/* The date belongs in the heading: it is the difference
                  between a page that looks maintained and one that does
                  not, and it is what the query itself usually asks for. */}
              <h1 className="mt-3 max-w-3xl text-balance font-head text-[38px] font-extrabold leading-[1.02] text-ink sm:text-[58px] sm:leading-[0.98] lg:text-[68px]">
                <span className="block sm:inline">Fuel prices</span>{" "}
                <span className="block sm:inline">in India</span>
                {asOfLabel && (
                  <span className="mt-4 block font-body text-[15px] font-semibold leading-6 text-muted sm:text-[18px]">
                    Live petrol, diesel and CNG rates across {totalCities.toLocaleString("en-IN")} cities. Updated {asOfLabel} at 6:00 AM.
                  </span>
                )}
              </h1>

              <div className="mt-7 grid max-w-[620px] gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div id="city-search">
                  <FuelCitySearch />
                </div>
                <a
                  href="#state-directory"
                  className="inline-flex min-h-12 items-center justify-center rounded-[7px] border border-ink bg-surface px-5 text-[13px] font-bold text-ink no-underline transition hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Browse states
                </a>
              </div>
              <div className="mt-3 max-w-[620px]">
                <FuelStateCityPicker states={states} />
              </div>

              <div className="mt-6 grid max-w-[620px] gap-3 sm:grid-cols-3">
                <div className="border-l-2 border-brand bg-surface/70 py-2 pl-3 shadow-[0_16px_42px_-36px_rgba(17,24,39,0.5)] backdrop-blur">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Cities</p>
                  <p className="mt-1 font-head text-[24px] font-extrabold leading-none text-ink tabular-nums">
                    {totalCities.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="border-l-2 border-ev bg-surface/70 py-2 pl-3 shadow-[0_16px_42px_-36px_rgba(17,24,39,0.5)] backdrop-blur">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Regions</p>
                  <p className="mt-1 font-head text-[24px] font-extrabold leading-none text-ink tabular-nums">
                    {statePrices.length || states.length}
                  </p>
                </div>
                <div className="border-l-2 border-ink bg-surface/70 py-2 pl-3 shadow-[0_16px_42px_-36px_rgba(17,24,39,0.5)] backdrop-blur">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Daily reset</p>
                  <p className="mt-1 font-head text-[24px] font-extrabold leading-none text-ink tabular-nums">6 AM</p>
                </div>
              </div>

              <p className="mt-5 flex items-center gap-2 text-[10.5px] font-semibold text-muted">
                <ShieldIcon className="size-3.5" /> Prices include state taxes and dealer commission.
              </p>
            </div>
          </div>

          {featured && (
            <div className="mt-12 lg:mt-16">
              <div className="mb-5 flex flex-col gap-3 border-t border-border/80 pt-7 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.08em] text-ink">
                  <PinIcon className="size-4 text-brand" /> Today in {featured.cityName}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <a href="#metro-comparison" className="text-[12px] font-bold text-brand no-underline hover:text-brand-hover">Compare with another city</a>
                  <a href="mailto:support@timesauto.net?subject=Fuel%20price%20alert" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-ink no-underline hover:text-brand">
                    <BellIcon className="size-3.5" /> Set price alert
                  </a>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {(["petrol", "diesel", "cng"] as FuelName[]).map((fuel) => (
                  <FuelSummaryCard
                    key={fuel}
                    fuel={fuel}
                    point={featured.prices[fuel]}
                    citySlug={featured.citySlug}
                    stateSlug={featured.stateSlug}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <FuelPopularCities cities={popular} />

      {metros.length > 0 && <MetroFuelComparison metros={metros} histories={histories} />}

      <FuelStateDirectory states={statePrices} />

      {/* The rail sits beside the FAQ rather than the price tables — those
          are wide by nature, and this is where the page stops reporting
          and starts explaining. */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <FuelFaq scope={{ place: "India" }} />
          </div>
          <div className="w-full lg:w-[300px] lg:shrink-0">
            <PageSidebar
              adSlotId="fuel-price"
              blocks={[
                {
                  title: "What it costs to run",
                  links: [
                    { href: routes.mileageCalculator(), label: "Running cost", note: "What every km costs you" },
                    { href: routes.fuelComparisonCalculator(), label: "Petrol vs diesel vs CNG", note: "Which fuel pays off" },
                    { href: routes.evChargingCalculator(), label: "EV charging time", note: "How long a charge takes" },
                  ],
                },
                {
                  title: "Browse cars",
                  links: [
                    { href: routes.electricCars(), label: "Electric cars", note: "Skip the pump entirely" },
                    { href: routes.newCars(), label: "All new cars", note: "Every model on sale" },
                  ],
                },
              ]}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

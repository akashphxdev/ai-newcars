import type { Metadata } from "next";
import PageSidebar from "@/components/common/PageSidebar";
import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/common/JsonLd";
import { ShieldIcon } from "@/components/common/icons";
import FuelCitySearch from "@/components/fuel/FuelCitySearch";
import FuelFaq from "@/components/fuel/FuelFaq";
import FuelPopularCities from "@/components/fuel/FuelPopularCities";
import FuelStateCityPicker from "@/components/fuel/FuelStateCityPicker";
import FuelStateDirectory from "@/components/fuel/FuelStateDirectory";
import FuelTodayInCity from "@/components/fuel/FuelTodayInCity";
import MetroFuelComparison from "@/components/fuel/MetroFuelComparison";
import {
  getFuelHistory,
  getFuelStatePrices,
  getFuelStates,
  getMetroFuelPrices,
  getPopularCityFuelPrices,
} from "@/features/fuel/fuel.api";
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
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-5 sm:pb-10 sm:pt-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] text-muted">
            <Link href={routes.home()} className="text-muted no-underline hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-ink">Fuel prices</span>
          </nav>

          <div className="mt-4 max-w-[720px]">
            <div className="relative z-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-brand">Daily fuel watch</p>
              {/* The date belongs in the heading: it is the difference
                  between a page that looks maintained and one that does
                  not, and it is what the query itself usually asks for. */}
              <h1 className="mt-1.5 max-w-3xl text-balance font-head text-[30px] font-extrabold leading-[1.05] text-ink sm:text-[40px] sm:leading-[1.02]">
                Fuel prices in India
              </h1>
              {asOfLabel && (
                <p className="mt-2 font-body text-[13px] font-semibold leading-5 text-muted sm:text-[14.5px]">
                  Live petrol, diesel and CNG across {totalCities.toLocaleString("en-IN")} cities in{" "}
                  {statePrices.length || states.length} regions. Updated {asOfLabel}, 6:00 AM.
                </p>
              )}

              <div className="mt-4 grid max-w-[620px] gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div id="city-search">
                  <FuelCitySearch />
                </div>
                <a
                  href="#state-directory"
                  className="inline-flex min-h-11 items-center justify-center rounded-[7px] border border-ink bg-surface px-5 text-[13px] font-bold text-ink no-underline transition hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Browse states
                </a>
              </div>
              <div className="mt-2.5 max-w-[620px]">
                <FuelStateCityPicker states={states} />
              </div>

              {/* The three stat tiles said what the sentence above already
                  says, in far more vertical space — the prices are what
                  the visitor came for, so they win the fold. */}
              <p className="mt-3 flex items-center gap-1.5 text-[10.5px] font-semibold text-muted">
                <ShieldIcon className="size-3.5" /> Prices include state taxes and dealer commission.
              </p>
            </div>
          </div>

          {featured && (
            <div className="mt-6 border-t border-border/80 pt-5">
              <FuelTodayInCity
                fallback={{
                  cityName: featured.cityName,
                  citySlug: featured.citySlug,
                  stateSlug: featured.stateSlug,
                  prices: featured.prices,
                }}
              />
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

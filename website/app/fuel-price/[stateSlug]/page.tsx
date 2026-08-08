import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import JsonLd from "@/components/common/JsonLd";
import { ShieldIcon } from "@/components/common/icons";
import FuelCitySearch from "@/components/fuel/FuelCitySearch";
import FuelFaq from "@/components/fuel/FuelFaq";
import FuelStateCityList from "@/components/fuel/FuelStateCityList";
import { getFuelState, getFuelStates, resolveFuelCityState } from "@/features/fuel/fuel.api";
import { FUEL_TYPE_IDS, type FuelName, type StateCityFuelRow } from "@/features/fuel/fuel.types";
import { formatFuelDate, formatFuelPrice, mergeCityRows } from "@/lib/fuel";
import { routes } from "@/lib/routes";
import { breadcrumbJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ stateSlug: string }> };

export const revalidate = 3600;

export async function generateStaticParams() {
  const states = await getFuelStates().catch(() => []);
  return states.map((state) => ({ stateSlug: state.slug }));
}

// Cheapest and costliest petrol in the state — the two facts a state page
// can state that no city page can.
function extremes(cities: StateCityFuelRow[]) {
  const priced = cities.filter((city) => Number.isFinite(Number(city.prices.petrol?.price)));
  if (priced.length < 2) return null;
  const sorted = [...priced].sort(
    (a, b) => Number(a.prices.petrol!.price) - Number(b.prices.petrol!.price),
  );
  return { cheapest: sorted[0], costliest: sorted[sorted.length - 1] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug } = await params;
  const data = await getFuelState(stateSlug);
  if (!data) return { title: "Fuel Price | TimesAuto" };

  const canonical = routes.fuelPriceInState(data.state.slug);
  const title = `Petrol, Diesel & CNG Price in ${data.state.name} Today | TimesAuto`;
  const description = `City-wise fuel prices across ${data.state.cityCount} cities in ${data.state.name}, updated daily at 6 AM. Compare petrol, diesel and CNG rates by city.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}

export default async function FuelPriceStatePage({ params }: Props) {
  const { stateSlug } = await params;
  // Three calls, not one: the table shows all three fuels, and the API
  // answers per fuel. They are independent, so they overlap.
  const [petrol, diesel, cng] = await Promise.all(
    (["petrol", "diesel", "cng"] as FuelName[]).map((fuel) =>
      getFuelState(stateSlug, FUEL_TYPE_IDS[fuel])),
  );
  const data = petrol;

  // /fuel-price/<city> URLs predate the state segment and land here,
  // because a bare slug is indistinguishable from a state slug. Send
  // them on to the canonical path rather than 404ing.
  if (!data) {
    const owningState = await resolveFuelCityState(stateSlug);
    if (owningState) permanentRedirect(routes.fuelPriceInCity(owningState, stateSlug));
    notFound();
  }

  const cities = mergeCityRows({
    petrol: data.cities,
    diesel: diesel?.cities,
    cng: cng?.cities,
  });
  const range = extremes(cities);
  const asOf = data.cities[0]?.updatedOn;
  const asOfLabel = formatFuelDate(asOf);

  const crumbs = [
    { name: "Fuel prices in India", href: routes.fuelPrice() },
    { name: data.state.name },
  ];

  return (
    <main className="bg-page">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <section className="border-b border-border-soft bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[10px] text-muted">
            <Link href={routes.fuelPrice()} className="text-muted no-underline hover:text-brand">India</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-ink">{data.state.name}</span>
          </nav>

          <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div>
              <p className="text-[11px] font-bold uppercase text-brand">State price directory</p>
              <h1 className="mt-2 font-head text-[34px] font-extrabold leading-[1.06] text-ink sm:text-[44px]">
                Petrol, diesel &amp; CNG price in {data.state.name} today
                {asOfLabel && (
                  <span className="mt-1 block text-[20px] font-bold text-muted sm:text-[24px]">
                    {asOfLabel}
                  </span>
                )}
              </h1>
              <p className="mt-3 max-w-2xl text-[13px] leading-6 text-muted">
                Today&apos;s rates across {data.state.cityCount}{" "}
                {data.state.cityCount === 1 ? "city" : "cities"} in {data.state.name}.
                {range && (
                  <>
                    {" "}Petrol is cheapest in{" "}
                    <Link
                      href={routes.fuelPriceInCity(data.state.slug, range.cheapest.citySlug)}
                      className="font-bold text-brand no-underline hover:text-brand-hover"
                    >
                      {range.cheapest.cityName}
                    </Link>{" "}
                    at {formatFuelPrice(range.cheapest.prices.petrol?.price)} and costliest in{" "}
                    <Link
                      href={routes.fuelPriceInCity(data.state.slug, range.costliest.citySlug)}
                      className="font-bold text-brand no-underline hover:text-brand-hover"
                    >
                      {range.costliest.cityName}
                    </Link>{" "}
                    at {formatFuelPrice(range.costliest.prices.petrol?.price)}.
                  </>
                )}
              </p>
              <p className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-muted">
                <span className="size-2 rounded-full bg-ev" /> Rates revised daily at 6:00 AM
              </p>
            </div>

            <div className="lg:pt-8">
              <p className="mb-2 text-[11px] font-bold uppercase text-muted">Jump to a city</p>
              <FuelCitySearch placeholder="Search any city in India" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <h2 className="sr-only">City-wise fuel prices in {data.state.name}</h2>
        <FuelStateCityList
          stateSlug={data.state.slug}
          stateName={data.state.name}
          cities={cities}
        />
      </section>

      <FuelFaq scope={{ place: data.state.name }} />

      <div className="border-y border-border-soft bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="flex max-w-3xl items-start gap-2 leading-5">
            <ShieldIcon className="mt-0.5 size-4 shrink-0" />
            Prices are sourced from public oil-marketing updates and local dealer reports. Actual pump prices may vary slightly.
          </p>
          <Link href={routes.fuelPrice()} className="font-semibold text-ink no-underline hover:text-brand">
            All states
          </Link>
        </div>
      </div>
    </main>
  );
}

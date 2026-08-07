import type { Metadata } from "next";
import { notFound } from "next/navigation";
import UsedCarCard from "@/components/cars/UsedCarCard";
import { getUsedCarsByCity } from "@/features/usedCars/usedCar.api";

type Props = { params: Promise<{ citySlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { citySlug } = await params;
  const res = await getUsedCarsByCity(citySlug, 1);
  if (!res) return { title: "Used Cars | TimesAuto" };
  return {
    title: `Used Cars in ${res.city.name} | TimesAuto`,
    description: `Browse verified second-hand cars for sale in ${res.city.name} — prices, kilometres driven, ownership and inspection status.`,
  };
}

export default async function UsedCarsInCityPage({ params }: Props) {
  const { citySlug } = await params;
  const res = await getUsedCarsByCity(citySlug, 48);

  // An unknown city is a real 404, not an empty list — otherwise every
  // typo renders a valid-looking page for Google to index.
  if (!res) notFound();

  const { city, listings } = res;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">Used Cars in {city.name}</h1>
      <p className="mt-2 text-sm text-muted">
        {listings.length > 0
          ? `${listings.length} verified ${listings.length === 1 ? "listing" : "listings"} available`
          : `No listings in ${city.name} yet`}
      </p>

      {listings.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((car) => (
            <UsedCarCard key={car.id} car={car} />
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-xl border border-border bg-surface p-6 text-sm text-muted">
          We don&apos;t have used cars listed in {city.name} at the moment. Check back soon.
        </p>
      )}
    </div>
  );
}

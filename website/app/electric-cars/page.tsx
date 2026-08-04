import type { Metadata } from "next";
import { getCarsBrowse } from "@/features/cars/car.api";
import ElectricCarsHero from "@/components/cars/ElectricCarsHero";
import NewCarsFilterSidebar from "@/components/cars/NewCarsFilterSidebar";
import BrandCarsSort from "@/components/brands/BrandCarsSort";
import InfiniteCarGrid from "@/components/cars/InfiniteCarGrid";

export const metadata: Metadata = {
  title: "Electric Cars in India | TimesAuto",
  description: "Browse all electric cars available in India — compare range, battery, charging time, and on-road prices.",
};

// fuelType is fixed to "electric" here — the sidebar hides that filter
// (showFuelType=false) since toggling it would be a no-op; brand, body
// type, price, and sort are all still adjustable.
type Props = {
  searchParams: Promise<{ brand?: string; bodyType?: string; maxPrice?: string; sort?: string }>;
};

const VALID_SORTS = ["popularity", "price-asc", "price-desc", "rating"] as const;
type SortValue = (typeof VALID_SORTS)[number];

export default async function ElectricCarsPage({ searchParams }: Props) {
  const sp = await searchParams;

  const brand = sp.brand ? sp.brand.split(",").filter(Boolean) : undefined;
  const bodyType = sp.bodyType ? sp.bodyType.split(",").filter(Boolean) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const sort: SortValue = VALID_SORTS.includes(sp.sort as SortValue) ? (sp.sort as SortValue) : "popularity";

  const filters = { limit: 12, brand, bodyType, maxPrice, sort, fuelType: ["electric"] };
  const result = await getCarsBrowse({ page: 1, ...filters });
  const { cars, pagination, filters: filterOptions } = result;

  return (
    <div>
      <ElectricCarsHero />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-muted">
            Browse all {pagination.total} electric cars available in India. Compare real-world range, battery
            capacity, charging time, and on-road prices to find the EV that fits your driving needs.
          </p>
          <BrandCarsSort basePath="/electric-cars" sort={sort} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <NewCarsFilterSidebar
            brands={filterOptions.brands}
            bodyTypes={filterOptions.bodyTypes}
            fuelTypes={filterOptions.fuelTypes}
            showFuelType={false}
            initial={{ brand, bodyType, maxPrice }}
            basePath="/electric-cars"
          />

          <InfiniteCarGrid
            key={`${brand?.join(",")}|${bodyType?.join(",")}|${maxPrice}|${sort}`}
            initialCars={cars}
            initialPagination={pagination}
            source={{ kind: "browse", filters }}
          />
        </div>
      </div>
    </div>
  );
}

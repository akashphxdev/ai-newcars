import type { Metadata } from "next";
import { getCarsBrowse } from "@/features/cars/car.api";
import NewCarsFilterSidebar from "@/components/cars/NewCarsFilterSidebar";
import BrandCarsSort from "@/components/brands/BrandCarsSort";
import InfiniteCarGrid from "@/components/cars/InfiniteCarGrid";

export const metadata: Metadata = {
  title: "Upcoming Cars in India | TimesAuto",
  description: "Browse all upcoming car launches in India — expected launch dates, estimated prices, and countdowns.",
};

// launchStatus is fixed to "upcoming" here — everything else (brand, body
// type, fuel type, price, sort) stays filterable, same as /new-cars.
type Props = {
  searchParams: Promise<{ brand?: string; bodyType?: string; fuelType?: string; maxPrice?: string; sort?: string }>;
};

const VALID_SORTS = ["popularity", "price-asc", "price-desc", "rating"] as const;
type SortValue = (typeof VALID_SORTS)[number];

export default async function UpcomingCarsPage({ searchParams }: Props) {
  const sp = await searchParams;

  const brand = sp.brand ? sp.brand.split(",").filter(Boolean) : undefined;
  const bodyType = sp.bodyType ? sp.bodyType.split(",").filter(Boolean) : undefined;
  const fuelType = sp.fuelType ? sp.fuelType.split(",").filter(Boolean) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const sort: SortValue = VALID_SORTS.includes(sp.sort as SortValue) ? (sp.sort as SortValue) : "popularity";

  const filters = { limit: 12, brand, bodyType, fuelType, maxPrice, sort, launchStatus: "upcoming" as const };
  const result = await getCarsBrowse({ page: 1, ...filters });
  const { cars, pagination, filters: filterOptions } = result;

  return (
    <div>
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <h1 className="font-head text-2xl font-extrabold text-ink sm:text-3xl">Upcoming Cars in India</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Real-time countdowns for the most anticipated launches — expected launch dates and estimated prices,
            updated as manufacturers confirm details.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] font-medium text-muted">{pagination.total} upcoming cars</p>
          <BrandCarsSort basePath="/upcoming-cars" sort={sort} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <NewCarsFilterSidebar
            brands={filterOptions.brands}
            bodyTypes={filterOptions.bodyTypes}
            fuelTypes={filterOptions.fuelTypes}
            initial={{ brand, bodyType, fuelType, maxPrice }}
            basePath="/upcoming-cars"
          />

          <InfiniteCarGrid
            key={`${brand?.join(",")}|${bodyType?.join(",")}|${fuelType?.join(",")}|${maxPrice}|${sort}`}
            initialCars={cars}
            initialPagination={pagination}
            source={{ kind: "browse", filters }}
            cardType="upcoming"
            // UpcomingCarCard's h-full is fine in its original single-row
            // horizontal rail (home page), but fights flexbox's cross-axis
            // stretch once wrapped onto multiple rows (every card in a row
            // stretching to match the tallest, cascading oddly across
            // rows). CSS grid sizes each row independently, so it doesn't
            // hit that — auto-fill at the card's own fixed width instead
            // of a responsive column count, since this card isn't designed
            // to stretch wider than 260px.
            gridClassName="grid grid-cols-[repeat(auto-fill,260px)] justify-center gap-5"
          />
        </div>
      </div>
    </div>
  );
}

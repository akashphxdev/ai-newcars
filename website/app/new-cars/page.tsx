import type { Metadata } from "next";
import Link from "next/link";
import { getCarsBrowse } from "@/features/cars/car.api";
import NewCarsFilterSidebar from "@/components/cars/NewCarsFilterSidebar";
import BrandCarsSort from "@/components/brands/BrandCarsSort";
import InfiniteCarGrid from "@/components/cars/InfiniteCarGrid";
import { formatSinglePrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "New Cars in India | TimesAuto",
  description: "Browse every new car available in India — filter by brand, body type, fuel type, and price.",
};

type Props = {
  searchParams: Promise<{
    brand?: string;
    bodyType?: string;
    fuelType?: string;
    maxPrice?: string;
    sort?: string;
  }>;
};

const VALID_SORTS = ["popularity", "price-asc", "price-desc", "rating"] as const;
type SortValue = (typeof VALID_SORTS)[number];

export default async function NewCarsPage({ searchParams }: Props) {
  const sp = await searchParams;

  const brand = sp.brand ? sp.brand.split(",").filter(Boolean) : undefined;
  const bodyType = sp.bodyType ? sp.bodyType.split(",").filter(Boolean) : undefined;
  const fuelType = sp.fuelType ? sp.fuelType.split(",").filter(Boolean) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const sort: SortValue = VALID_SORTS.includes(sp.sort as SortValue) ? (sp.sort as SortValue) : "popularity";

  const filters = { limit: 12, brand, bodyType, fuelType, maxPrice, sort };
  const result = await getCarsBrowse({ page: 1, ...filters });
  const { cars, pagination, filters: filterOptions } = result;

  return (
    <div>
      <div className="border-b border-border bg-page">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold" aria-label="Breadcrumb">
            <Link href="/" className="text-ink">
              Home
            </Link>
            <span className="text-muted">{">"}</span>
            <span className="text-brand">New Cars</span>
          </nav>

          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">New Cars in India</h1>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed font-normal text-muted">
            Browse every new car available in India. Filter by brand, body type, fuel type, and budget to find
            detailed specifications, on-road prices, and mileage for the car that fits your needs.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink">
              {pagination.total} model{pagination.total === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink">
              From {formatSinglePrice(filterOptions.priceRange.min)}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <NewCarsFilterSidebar
            brands={filterOptions.brands}
            bodyTypes={filterOptions.bodyTypes}
            fuelTypes={filterOptions.fuelTypes}
            initial={{ brand, bodyType, fuelType, maxPrice }}
            basePath="/new-cars"
          />

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold text-ink">All New Cars</h2>
                <p className="text-[12.5px] text-muted">
                  Showing {cars.length} of {pagination.total} cars
                </p>
              </div>
              <BrandCarsSort basePath="/new-cars" sort={sort} />
            </div>

            <InfiniteCarGrid
              key={`${brand?.join(",")}|${bodyType?.join(",")}|${fuelType?.join(",")}|${maxPrice}|${sort}`}
              initialCars={cars}
              initialPagination={pagination}
              source={{ kind: "browse", filters }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

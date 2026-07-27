import type { Metadata } from "next";
import Link from "next/link";
import { getCarsBrowse } from "@/features/cars/car.api";
import NewCarsFilterSidebar from "@/components/cars/NewCarsFilterSidebar";
import BrandCarsSort from "@/components/brands/BrandCarsSort";
import BrandCarCard from "@/components/brands/BrandCarCard";
import Pagination from "@/components/common/Pagination";
import { formatSinglePrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "New Cars in India | TimesAuto",
  description: "Browse every new car available in India — filter by brand, body type, fuel type, and price.",
};

type Props = {
  searchParams: Promise<{
    page?: string;
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

  const page = Math.max(1, Number(sp.page) || 1);
  const brand = sp.brand ? sp.brand.split(",").filter(Boolean) : undefined;
  const bodyType = sp.bodyType ? sp.bodyType.split(",").filter(Boolean) : undefined;
  const fuelType = sp.fuelType ? sp.fuelType.split(",").filter(Boolean) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const sort: SortValue = VALID_SORTS.includes(sp.sort as SortValue) ? (sp.sort as SortValue) : "popularity";

  const result = await getCarsBrowse({ page, limit: 12, brand, bodyType, fuelType, maxPrice, sort });
  const { cars, pagination, filters } = result;

  const queryParams: Record<string, string> = {};
  if (brand?.length) queryParams.brand = brand.join(",");
  if (bodyType?.length) queryParams.bodyType = bodyType.join(",");
  if (fuelType?.length) queryParams.fuelType = fuelType.join(",");
  if (maxPrice) queryParams.maxPrice = String(maxPrice);
  if (sort !== "popularity") queryParams.sort = sort;

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
              From {formatSinglePrice(filters.priceRange.min)}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <NewCarsFilterSidebar
            brands={filters.brands}
            bodyTypes={filters.bodyTypes}
            fuelTypes={filters.fuelTypes}
            initial={{ brand, bodyType, fuelType, maxPrice }}
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

            {cars.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {cars.map((car) => (
                    <BrandCarCard key={car.id} car={car} />
                  ))}
                </div>
                <Pagination pagination={pagination} basePath="/new-cars" queryParams={queryParams} />
              </>
            ) : (
              <p className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">
                No cars match these filters — try adjusting them.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

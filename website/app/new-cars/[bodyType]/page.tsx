import { Suspense } from "react";
import type { Metadata } from "next";
import { getEntityPageMetadata } from "@/features/seo/seo.api";
import { SEO_PAGE_TYPE } from "@/features/seo/seo.types";
import { notFound } from "next/navigation";
import { getBodyTypeBySlug, getBodyTypeCars, getAllBodyTypesWithCounts } from "@/features/bodyTypes/bodyType.api";
import { getRandomPairs } from "@/features/compare/compare.api";
import BodyTypeCarsHero from "@/components/bodyTypes/BodyTypeCarsHero";
import BodyTypeCarsFilterSidebar from "@/components/bodyTypes/BodyTypeCarsFilterSidebar";
import BrandCarsSort from "@/components/brands/BrandCarsSort";
import BrandElectricCarsRail from "@/components/brands/BrandElectricCarsRail";
import BrandComparisonsSection from "@/components/brands/BrandComparisonsSection";
import InfiniteCarGrid from "@/components/cars/InfiniteCarGrid";
import SectionSkeleton from "@/components/common/SectionSkeleton";
import { routes } from "@/lib/routes";

// "/new-cars/suv". Body types are filtered new-car listings, so they nest
// under /new-cars instead of sharing the /*-cars namespace with the 77
// brand slugs — nothing prevented a collision there, and resolving one
// cost a wasted brand lookup on every request.

type Props = {
  params: Promise<{ bodyType: string }>;
  searchParams: Promise<SearchParams>;
};

type SearchParams = {
  page?: string;
  bodyType?: string;
  brand?: string;
  fuelType?: string;
  maxPrice?: string;
  sort?: string;
};

const VALID_SORTS = ["popularity", "price-asc", "price-desc", "rating"] as const;
type SortValue = (typeof VALID_SORTS)[number];

function parseSort(raw: string | undefined): SortValue {
  return VALID_SORTS.includes(raw as SortValue) ? (raw as SortValue) : "popularity";
}

async function BodyTypeElectricCarsSection({ slug, bodyTypeName }: { slug: string; bodyTypeName: string }) {
  const result = await getBodyTypeCars(slug, { fuelType: ["electric"], limit: 6, sort: "popularity" });
  if (!result || result.cars.length === 0) return null;
  return (
    <BrandElectricCarsRail
      cars={result.cars}
      title={`Electric ${bodyTypeName}s`}
      subtitle={`Range, battery, and charging specs for every electric ${bodyTypeName}`}
    />
  );
}

async function BodyTypeComparisons({ slug, bodyTypeName }: { slug: string; bodyTypeName: string }) {
  const { pairs } = await getRandomPairs({ bodyTypeSlug: slug, count: 6 });
  return (
    <BrandComparisonsSection
      pairs={pairs}
      eyebrow="Decide Faster"
      title={`Compare ${bodyTypeName} cars`}
      subtitle={`See how different ${bodyTypeName} models stack up against each other`}
    />
  );
}

async function BodyTypeCarsPageContent({ slug, sp }: { slug: string; sp: SearchParams }) {
  const page = Math.max(1, Number(sp.page) || 1);
  const brand = sp.brand ? sp.brand.split(",").filter(Boolean) : undefined;
  const fuelType = sp.fuelType ? sp.fuelType.split(",").filter(Boolean) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const sort = parseSort(sp.sort);

  const [result, otherBodyTypes] = await Promise.all([
    getBodyTypeCars(slug, { page, limit: 12, brand, fuelType, maxPrice, sort }),
    getAllBodyTypesWithCounts(),
  ]);
  if (!result) notFound();

  const { bodyType, cars, pagination, filters } = result;
  const basePath = routes.bodyType(bodyType.slug);

  return (
    <div>
      <BodyTypeCarsHero bodyType={bodyType} result={result} otherBodyTypes={otherBodyTypes} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <BodyTypeCarsFilterSidebar
            bodyTypeSlug={bodyType.slug}
            brands={filters.brands}
            fuelTypes={filters.fuelTypes}
            initial={{ brand, fuelType, maxPrice }}
          />

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold text-ink">All {bodyType.name} Cars</h2>
                <p className="text-[12.5px] text-muted">
                  Showing {cars.length} of {pagination.total} cars
                </p>
              </div>
              <BrandCarsSort basePath={basePath} sort={sort} />
            </div>

            <InfiniteCarGrid
              key={`${brand?.join(",")}|${fuelType?.join(",")}|${maxPrice}|${sort}`}
              initialCars={cars}
              initialPagination={pagination}
              source={{ kind: "bodyType", slug: bodyType.slug, filters: { limit: 12, brand, fuelType, maxPrice, sort } }}
            />

            <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[14px] font-semibold text-ink">Compare up to 4 {bodyType.name} cars side by side</p>
                <p className="text-[12.5px] text-muted">Select cars to compare specifications, features, and prices.</p>
              </div>
              <a
                href="/compare-cars"
                className="shrink-0 whitespace-nowrap rounded-xl border-[1.5px] border-brand px-5 py-2.5 text-[13px] font-semibold text-brand transition-colors hover:bg-orange-50"
              >
                Compare Cars →
              </a>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<SectionSkeleton />}>
        <BodyTypeElectricCarsSection slug={bodyType.slug} bodyTypeName={bodyType.name} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <BodyTypeComparisons slug={bodyType.slug} bodyTypeName={bodyType.name} />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bodyType } = await params;
  const record = await getBodyTypeBySlug(bodyType);
  if (!record) return {};
  return getEntityPageMetadata(
    SEO_PAGE_TYPE.BODY_TYPE,
    record.id,
    { bodytype_name: record.name, bodytype_slug: record.slug },
    {
      title: `${record.name} Cars in India | TimesAuto`,
      description: `Explore every ${record.name} car available in India — prices, specs, and features.`,
    },
    routes.bodyType(record.slug),
  );
}

export default async function BodyTypeCarsPage({ params, searchParams }: Props) {
  const { bodyType } = await params;
  const sp = await searchParams;

  const record = await getBodyTypeBySlug(bodyType);
  if (!record) notFound();

  return <BodyTypeCarsPageContent slug={bodyType} sp={sp} />;
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrandBySlug, getBrandCars, getBrandArticles, getAllBrandsWithCounts } from "@/features/brands/brand.api";
import { getBodyTypeBySlug, getBodyTypeCars, getAllBodyTypesWithCounts } from "@/features/bodyTypes/bodyType.api";
import { getRandomPairs, getBrandCrossPairs } from "@/features/compare/compare.api";
import BrandCarsHero from "@/components/brands/BrandCarsHero";
import BrandCarsFilterSidebar from "@/components/brands/BrandCarsFilterSidebar";
import BrandCarsSort from "@/components/brands/BrandCarsSort";
import BrandElectricCarsRail from "@/components/brands/BrandElectricCarsRail";
import BrandComparisonsSection from "@/components/brands/BrandComparisonsSection";
import OtherBrandsSection from "@/components/brands/OtherBrandsSection";
import BodyTypeCarsHero from "@/components/bodyTypes/BodyTypeCarsHero";
import BodyTypeCarsFilterSidebar from "@/components/bodyTypes/BodyTypeCarsFilterSidebar";
import InfiniteCarGrid from "@/components/cars/InfiniteCarGrid";
import Articles from "@/components/home/Articles";
import SectionSkeleton from "@/components/common/SectionSkeleton";

// One rewrite ("/:slug-cars" -> "/listing-cars/:slug", see next.config.ts)
// serves both brand pages ("/tata-motors-cars") and body-type pages
// ("/suv-cars") — a rewrite's source pattern can't tell them apart, so
// this page resolves the slug against brands first, then body types, and
// renders a fully different layout for each (see BrandCarsPageContent
// vs BodyTypeCarsPageContent below).

type SearchParams = {
  page?: string;
  bodyType?: string;
  brand?: string;
  fuelType?: string;
  maxPrice?: string;
  sort?: string;
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
};

const VALID_SORTS = ["popularity", "price-asc", "price-desc", "rating"] as const;
type SortValue = (typeof VALID_SORTS)[number];

function parseSort(raw: string | undefined): SortValue {
  return VALID_SORTS.includes(raw as SortValue) ? (raw as SortValue) : "popularity";
}

// ==================== Brand branch ====================

async function BrandElectricCarsSection({ slug, brandName }: { slug: string; brandName: string }) {
  const result = await getBrandCars(slug, { fuelType: ["electric"], limit: 6, sort: "popularity" });
  if (!result || result.cars.length === 0) return null;
  return (
    <BrandElectricCarsRail
      cars={result.cars}
      title={`${brandName} electric cars`}
      subtitle={`Range, battery, and charging specs for every ${brandName} EV`}
    />
  );
}

async function BrandSameBrandComparisons({ slug, brandName }: { slug: string; brandName: string }) {
  const { pairs } = await getRandomPairs({ brandSlug: slug, count: 6 });
  return (
    <BrandComparisonsSection
      pairs={pairs}
      eyebrow="Decide Faster"
      title={`Compare ${brandName} cars`}
      subtitle={`See how ${brandName} models stack up against each other`}
    />
  );
}

async function BrandCrossBrandComparisons({ slug, brandName }: { slug: string; brandName: string }) {
  const pairs = await getBrandCrossPairs(slug, 6);
  return (
    <BrandComparisonsSection
      pairs={pairs}
      eyebrow="How They Compare"
      title={`${brandName} vs other brands`}
      subtitle={`See how ${brandName} models stack up against the competition`}
    />
  );
}

async function BrandArticlesSection({ slug, brandName }: { slug: string; brandName: string }) {
  const articles = await getBrandArticles(slug);
  if (articles.length === 0) return null;
  return (
    <Articles
      articles={articles}
      eyebrow="Guides & News"
      title={`${brandName} articles`}
      subtitle={`Reviews, comparisons, and buying guides about ${brandName} cars`}
    />
  );
}

async function BrandOtherBrandsSection({ slug }: { slug: string }) {
  const brands = await getAllBrandsWithCounts();
  return <OtherBrandsSection brands={brands} currentSlug={slug} />;
}

async function BrandCarsPageContent({ slug, sp }: { slug: string; sp: SearchParams }) {
  const page = Math.max(1, Number(sp.page) || 1);
  const bodyType = sp.bodyType ? sp.bodyType.split(",").filter(Boolean) : undefined;
  const fuelType = sp.fuelType ? sp.fuelType.split(",").filter(Boolean) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const sort = parseSort(sp.sort);

  const result = await getBrandCars(slug, { page, limit: 12, bodyType, fuelType, maxPrice, sort });
  if (!result) notFound();

  const { brand, cars, pagination, filters } = result;
  const basePath = `/${brand.slug}-cars`;

  return (
    <div>
      <BrandCarsHero brand={brand} result={result} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <BrandCarsFilterSidebar
            brandSlug={brand.slug}
            bodyTypes={filters.bodyTypes}
            fuelTypes={filters.fuelTypes}
            initial={{ bodyType, fuelType, maxPrice }}
          />

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold text-ink">All {brand.name} Cars</h2>
                <p className="text-[12.5px] text-muted">
                  Showing {cars.length} of {pagination.total} cars
                </p>
              </div>
              <BrandCarsSort basePath={basePath} sort={sort} />
            </div>

            <InfiniteCarGrid
              key={`${bodyType?.join(",")}|${fuelType?.join(",")}|${maxPrice}|${sort}`}
              initialCars={cars}
              initialPagination={pagination}
              source={{ kind: "brand", slug: brand.slug, filters: { limit: 12, bodyType, fuelType, maxPrice, sort } }}
            />

            <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[14px] font-semibold text-ink">Compare up to 4 {brand.name} cars side by side</p>
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
        <BrandElectricCarsSection slug={brand.slug} brandName={brand.name} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <BrandSameBrandComparisons slug={brand.slug} brandName={brand.name} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <BrandCrossBrandComparisons slug={brand.slug} brandName={brand.name} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <BrandArticlesSection slug={brand.slug} brandName={brand.name} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <BrandOtherBrandsSection slug={brand.slug} />
      </Suspense>
    </div>
  );
}

// ==================== Body-type branch ====================

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
  const basePath = `/${bodyType.slug}-cars`;

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

// ==================== Resolver ====================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const brand = await getBrandBySlug(slug);
  if (brand) {
    return {
      title: `${brand.name} Cars in India | TimesAuto`,
      description: `Explore the full range of ${brand.name} cars in India — prices, specs, and features.`,
    };
  }

  const bodyType = await getBodyTypeBySlug(slug);
  if (bodyType) {
    return {
      title: `${bodyType.name} Cars in India | TimesAuto`,
      description: `Explore every ${bodyType.name} car available in India — prices, specs, and features.`,
    };
  }

  return {};
}

export default async function ListingCarsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const brand = await getBrandBySlug(slug);
  if (brand) {
    return <BrandCarsPageContent slug={slug} sp={sp} />;
  }

  const bodyType = await getBodyTypeBySlug(slug);
  if (bodyType) {
    return <BodyTypeCarsPageContent slug={slug} sp={sp} />;
  }

  notFound();
}

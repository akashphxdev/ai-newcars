import { Suspense } from "react";
import type { Metadata } from "next";
import { getCarOptions, getRandomPairs } from "@/features/compare/compare.api";
import { getBodyTypes } from "@/features/bodyTypes/bodyType.api";
import { getHomeCars } from "@/features/cars/car.api";
import { getArticlesByCategory } from "@/features/articles/article.api";
import CompareHero from "@/components/compare/CompareHero";
import ComparePicker from "@/components/compare/ComparePicker";
import CompareFilterSidebar from "@/components/compare/CompareFilterSidebar";
import RandomPairRow from "@/components/compare/RandomPairRow";
import RecentlyViewedComparisons from "@/components/compare/RecentlyViewedComparisons";
import CompareFaq from "@/components/compare/CompareFaq";
import Pagination from "@/components/common/Pagination";
import PopularCars from "@/components/home/Popularcars";
import Articles from "@/components/home/Articles";
import SectionSkeleton from "@/components/common/SectionSkeleton";
import type { FuelFilter } from "@/features/compare/compare.types";

export const metadata: Metadata = {
  title: "Compare Cars in India | TimesAuto",
  description: "Compare any two cars side-by-side — price, specs, features and performance, to find your perfect match.",
};

type Props = {
  searchParams: Promise<{ page?: string; bodyTypeSlug?: string; fuelType?: string; maxPrice?: string }>;
};

const VALID_FUEL: readonly string[] = ["petrol", "diesel", "cng", "electric"];

// Below-the-fold, non-critical — streamed in independently via
// <Suspense> so a slow call here never blocks the picker/filter/list
// (the content people actually came for) from rendering first.
async function PopularCarsSection() {
  const popularCars = await getHomeCars("popular");
  return <PopularCars cars={popularCars} />;
}

async function ComparisonGuidesSection() {
  const comparisonArticles = await getArticlesByCategory("comparison");
  return (
    <Articles
      articles={comparisonArticles}
      eyebrow="Comparison Guides"
      title="How to choose between them"
      subtitle="Head-to-head breakdowns and buying advice to help you decide"
      linkLabel="View all guides"
    />
  );
}

export default async function ComparePage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const bodyTypeSlug = sp.bodyTypeSlug || undefined;
  const fuelType = sp.fuelType && VALID_FUEL.includes(sp.fuelType) ? (sp.fuelType as FuelFilter) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;

  const [carOptions, bodyTypes, { pairs, pagination }] = await Promise.all([
    getCarOptions(),
    getBodyTypes(),
    getRandomPairs({ page, count: 6, bodyTypeSlug, fuelType, maxPrice }),
  ]);

  const queryParams: Record<string, string> = {};
  if (bodyTypeSlug) queryParams.bodyTypeSlug = bodyTypeSlug;
  if (fuelType) queryParams.fuelType = fuelType;
  if (maxPrice) queryParams.maxPrice = String(maxPrice);

  return (
    <div>
      <CompareHero />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <ComparePicker options={carOptions} />

        <div className="mt-6">
          <RecentlyViewedComparisons />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <CompareFilterSidebar bodyTypes={bodyTypes} initial={{ bodyTypeSlug, fuelType, maxPrice }} />

          <div>
            <p className="mb-3 text-[13px] font-semibold text-muted">
              Showing {pairs.length} of {pagination.total} comparisons
            </p>

            {pairs.length > 0 ? (
              <>
                <div className="overflow-hidden rounded-2xl border border-border bg-surface">
                  {pairs.map((pair, i) => (
                    <RandomPairRow key={`${pair.carA.id}-${pair.carB.id}-${i}`} pair={pair} />
                  ))}
                </div>
                <Pagination pagination={pagination} basePath="/compare-cars" queryParams={queryParams} />
              </>
            ) : (
              <p className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">
                No comparisons match these filters — try adjusting them.
              </p>
            )}
          </div>
        </div>

        <CompareFaq />
      </div>

      <Suspense fallback={<SectionSkeleton />}>
        <ComparisonGuidesSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <PopularCarsSection />
      </Suspense>
    </div>
  );
}

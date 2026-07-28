import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompareData, getCarOptions, getRandomPairs, getModelCrossPairs } from "@/features/compare/compare.api";
import { getHomeCars, getCarsBrowse } from "@/features/cars/car.api";
import { getAllBrands } from "@/features/brands/brand.api";
import CompareResults from "@/components/compare/CompareResults";
import BrandComparisonsSection from "@/components/brands/BrandComparisonsSection";
import RecordRecentComparison from "@/components/compare/RecordRecentComparison";
import PopularCars from "@/components/home/Popularcars";
import BrandsGrid from "@/components/brands/BrandsGrid";
import SectionHeader from "@/components/common/SectionHeader";
import SectionSkeleton from "@/components/common/SectionSkeleton";
import type { CompareCarResult } from "@/features/compare/compare.types";

const MIN_CARS = 2;
const MAX_CARS = 4;

type Props = {
  params: Promise<{ comparisonSlug: string }>;
};

// URL shape: /compare/{car1-slug}-vs-{car2-slug}[-vs-{car3-slug}...] —
// "-vs-" is the reserved separator between 2-4 car slugs, and that's ALL
// the URL ever carries (no variant/powertrain query params — same clean,
// canonical shape as CarDekho's /compare/model-a-and-model-b.htm). Each
// car defaults to its top-seller variant + default powertrain; switching
// either happens client-side in CompareResults without touching the URL.
// Deliberately a sibling of /compare-cars (the listing page) rather than
// nested under it, so the result page keeps the shorter /compare/... URL.
function splitComparisonSlug(comparisonSlug: string): string[] | null {
  const slugs = comparisonSlug.split("-vs-").filter(Boolean);
  if (slugs.length < MIN_CARS || slugs.length > MAX_CARS) return null;
  return slugs;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slugs = splitComparisonSlug((await params).comparisonSlug);
  if (!slugs) return {};

  const data = await getCompareData(slugs);
  if (!data) return {};

  const names = data.cars.map((c) => c.name).join(" vs ");
  return {
    title: `${names} — Compare | TimesAuto`,
    description: `Compare ${names} side-by-side — price, specs, features and performance.`,
  };
}

// Below-the-fold, non-critical — each fetches independently and streams
// in via its own <Suspense> below, so a slow call here never holds up
// the core comparison content (getCompareData) from rendering first.
// Same card treatment as the home page's Compare section (BrandComparisonsSection
// already matches it — built for the brand-cars page's "compare with"
// rail, reused here as-is).
async function LatestComparisonsSection() {
  const { pairs } = await getRandomPairs({ count: 8 });
  return (
    <BrandComparisonsSection
      pairs={pairs}
      eyebrow="Fresh Match-Ups"
      title="Latest Comparisons"
      subtitle="A running feed of the comparisons people are building right now — browse them for inspiration, or start your own above."
      titleSize="lg"
      cardWidthClass="w-64 sm:w-1/2 lg:w-1/4"
    />
  );
}

// One section per car actually in this comparison — "{car} vs other cars"
// — each car pinned on one side, paired against random other models
// (getModelCrossPairs, same fetcher the model detail page's own
// "Comparison" section uses).
async function PerCarComparisonsSection({ cars }: { cars: CompareCarResult[] }) {
  const pairsList = await Promise.all(cars.map((car) => getModelCrossPairs(car.brand.slug, car.slug, 6)));

  return (
    <>
      {cars.map((car, i) => (
        <BrandComparisonsSection
          key={car.id}
          pairs={pairsList[i]}
          eyebrow="Explore More"
          title={`${car.name} vs other cars`}
          subtitle={`Not sure the ${car.name} is the one? See how it measures up against other popular models on price, performance, and features.`}
          titleSize="lg"
          cardWidthClass="w-64 sm:w-1/2 lg:w-1/4"
        />
      ))}
    </>
  );
}

// Cars sharing the first compared car's body type (e.g. more SUVs), minus
// whichever of them are already in this comparison — falls back to the
// generic "popular" list when the first car has no body type or the
// body-type browse comes back empty (e.g. a body type with very few cars).
async function SimilarCarsSection({ cars }: { cars: CompareCarResult[] }) {
  const bodyTypeSlug = cars[0]?.bodyType?.slug;
  const comparedSlugs = new Set(cars.map((c) => c.slug));

  const similarCars = bodyTypeSlug
    ? (await getCarsBrowse({ bodyType: [bodyTypeSlug], limit: 8, sort: "popularity" })).cars.filter((c) => !comparedSlugs.has(c.slug))
    : [];

  const fallback = similarCars.length === 0 ? await getHomeCars("popular") : [];

  return (
    <PopularCars
      cars={similarCars.length > 0 ? similarCars : fallback}
      eyebrow="You May Also Like"
      title="Similar cars"
      href="/new-cars"
      linkLabel="View all cars"
    />
  );
}

async function ExploreOtherBrandsSection() {
  const brands = await getAllBrands();
  if (brands.length === 0) return null;

  return (
    <section className="py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader eyebrow="All Brands" title="Explore other brands" subtitle="Browse every car brand available on TimesAuto." />
        <BrandsGrid brands={brands} />
      </div>
    </section>
  );
}

export default async function ComparisonResultPage({ params }: Props) {
  const { comparisonSlug } = await params;
  const slugs = splitComparisonSlug(comparisonSlug);
  if (!slugs) notFound();

  const [data, carOptions] = await Promise.all([getCompareData(slugs), getCarOptions()]);
  if (!data) notFound();

  const { cars } = data;
  const names = cars.map((c) => c.name).join(" vs ");

  return (
    <div className="bg-page">
      <RecordRecentComparison comparisonSlug={comparisonSlug} cars={cars} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold" aria-label="Breadcrumb">
          <Link href="/" className="text-ink">
            Home
          </Link>
          <span className="text-muted">{">"}</span>
          <Link href="/compare-cars" className="text-ink">
            Compare
          </Link>
          <span className="text-muted">{">"}</span>
          <span className="text-brand">{names}</span>
        </nav>

        <CompareResults initialCars={cars} slugs={slugs} carOptions={carOptions} />
      </div>

      <Suspense fallback={<SectionSkeleton />}>
        <PerCarComparisonsSection cars={cars} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <LatestComparisonsSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <SimilarCarsSection cars={cars} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <ExploreOtherBrandsSection />
      </Suspense>
    </div>
  );
}

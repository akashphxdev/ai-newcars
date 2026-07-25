import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompareData, getRandomPairs } from "@/features/compare/compare.api";
import { getHomeCars } from "@/features/cars/car.api";
import CompareCarHeader from "@/components/compare/CompareCarHeader";
import SpecComparison from "@/components/compare/SpecComparison";
import RandomPairRow from "@/components/compare/RandomPairRow";
import RecordRecentComparison from "@/components/compare/RecordRecentComparison";
import PopularCars from "@/components/home/Popularcars";
import SectionSkeleton from "@/components/common/SectionSkeleton";

const MIN_CARS = 2;
const MAX_CARS = 4;

type Props = {
  params: Promise<{ comparisonSlug: string }>;
  // v0..v3 — variant override per car, aligned by position with the
  // slugs in comparisonSlug.
  searchParams: Promise<Record<string, string | undefined>>;
};

// URL shape: /compare/{car1-slug}-vs-{car2-slug}[-vs-{car3-slug}...] —
// "-vs-" is the reserved separator between 2-4 car slugs. Deliberately a
// sibling of /compare-cars (the listing page) rather than nested under
// it, so the result page keeps the shorter /compare/... URL.
function splitComparisonSlug(comparisonSlug: string): string[] | null {
  const slugs = comparisonSlug.split("-vs-").filter(Boolean);
  if (slugs.length < MIN_CARS || slugs.length > MAX_CARS) return null;
  return slugs;
}

function readVariantIds(searchParams: Record<string, string | undefined>, count: number): (number | undefined)[] {
  return Array.from({ length: count }, (_, i) => {
    const raw = searchParams[`v${i}`];
    const n = raw ? Number(raw) : undefined;
    return n && Number.isFinite(n) ? n : undefined;
  });
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
async function LatestComparisonsSection() {
  const { pairs: latestPairs } = await getRandomPairs({ count: 5 });
  if (latestPairs.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="mb-3 text-[16px] font-bold text-ink">Latest Comparisons</h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {latestPairs.map((pair, i) => (
          <RandomPairRow key={`${pair.carA.id}-${pair.carB.id}-${i}`} pair={pair} />
        ))}
      </div>
    </div>
  );
}

async function PopularCarsSection() {
  const popularCars = await getHomeCars("popular");
  return <PopularCars cars={popularCars} />;
}

export default async function ComparisonResultPage({ params, searchParams }: Props) {
  const { comparisonSlug } = await params;
  const slugs = splitComparisonSlug(comparisonSlug);
  if (!slugs) notFound();

  const sp = await searchParams;
  const variantIds = readVariantIds(sp, slugs.length);

  const data = await getCompareData(slugs, variantIds);
  if (!data) notFound();

  const { cars } = data;
  const names = cars.map((c) => c.name).join(" vs ");

  return (
    <div className="bg-page">
      <RecordRecentComparison comparisonSlug={comparisonSlug} cars={cars} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
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

        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
          {cars.map((car, i) => (
            <CompareCarHeader key={car.id} car={car} paramKey={`v${i}`} />
          ))}

          {cars.length === 2 && (
            <span className="absolute left-1/2 top-1/2 hidden size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-page bg-brand text-[12px] font-bold text-white sm:flex">
              VS
            </span>
          )}
        </div>

        <div className="mt-6">
          <SpecComparison cars={cars} />
        </div>

        <Suspense fallback={<div className="mt-10 h-48 animate-pulse rounded-2xl bg-black/5" />}>
          <LatestComparisonsSection />
        </Suspense>
      </div>

      <Suspense fallback={<SectionSkeleton />}>
        <PopularCarsSection />
      </Suspense>
    </div>
  );
}

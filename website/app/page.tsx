import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllSchemas, getSeoMeta, getStaticPageMetadata } from "@/features/seo/seo.api";
import { SEO_PAGE_TYPE } from "@/features/seo/seo.types";
import SeoJsonLd from "@/components/common/SeoJsonLd";
import { buildSiteSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/routes";
import HeroSection from "@/components/home/HeroSection";
import CuratedCars from "@/components/home/CuratedCars";
import ElectricCars from "@/components/home/Electriccars";
import GuidedDiscovery from "@/components/home/GuidedDiscovery";
import PopularBrands from "@/components/home/PopularBrands";
import UpcomingLaunches from "@/components/home/UpcomingLaunches";
import CompareCars from "@/components/home/Comparecars";
import Stories from "@/components/home/Stories";
import Articles from "@/components/home/Articles";
import Reviews from "@/components/home/Reviews";
import SectionSkeleton from "@/components/common/SectionSkeleton";
import { getBanners } from "@/features/banners/banner.api";
import { getBrands } from "@/features/brands/brand.api";
import { getCarsBrowse, getHomeCars } from "@/features/cars/car.api";
import { getHomeArticles } from "@/features/articles/article.api";
import { getHomeTestimonials } from "@/features/testimonials/testimonial.api";
import { getHomeStories } from "@/features/stories/story.api";
import { getBodyTypes } from "@/features/bodyTypes/bodyType.api";
import { getCarOptions, getCompareData, getRandomPairs } from "@/features/compare/compare.api";

// Each of these is its own async Server Component, fetching only the data
// its section needs. Wrapping each one in its own <Suspense> below means a
// slow section (e.g. Reviews) never blocks a fast one (e.g. Hero) from
// showing up first — sections stream in as their data resolves instead of
// the whole page waiting on the slowest fetch.

export async function generateMetadata(): Promise<Metadata> {
  return getStaticPageMetadata(
    "home",
    {
      title: "TimesAuto — New Car Prices, Specs, Mileage & Comparisons in India",
      description:
        "On-road prices, specifications, mileage and side-by-side comparisons for every new car on sale in India.",
    },
    "/",
  );
}

// No h1Override here: the home <h1> is the rotating banner's own heading,
// so a single admin string would freeze the carousel's headline.
async function HeroSectionData() {
  // revalidate window, so Next.js dedupes it into one request, not two.
  const [banners, bodyTypes] = await Promise.all([getBanners(), getBodyTypes()]);
  return <HeroSection banners={banners} bodyTypes={bodyTypes} />;
}

async function PopularBrandsData() {
  const brands = await getBrands();
  return <PopularBrands brands={brands} />;
}

async function GuidedDiscoveryData() {
  // One row is all the browse call needs — the facets and
  // pagination.total come back regardless, and they are the whole
  // payload. Brands come separately because the facet carries counts but
  // no logo.
  const [{ filters }, brands] = await Promise.all([
    getCarsBrowse({ page: 1, limit: 1 }),
    getBrands(8),
  ]);
  return <GuidedDiscovery initialFilters={filters} brandLogos={brands} />;
}

async function CuratedCarsData() {
  const cars = await getHomeCars("latest", 4);
  return <CuratedCars initialCars={cars} />;
}

async function ElectricCarsData() {
  const cars = await getHomeCars("electric", 4);
  return <ElectricCars cars={cars} />;
}

async function UpcomingLaunchesData() {
  const cars = await getHomeCars("upcoming");
  return <UpcomingLaunches cars={cars} />;
}

async function CompareCarsData() {
  const { pairs } = await getRandomPairs({ count: 6 });
  const [comparison, options] = await Promise.all([
    pairs[0]
      ? getCompareData([pairs[0].carA.slug, pairs[0].carB.slug])
      : Promise.resolve(null),
    getCarOptions(),
  ]);
  return <CompareCars pairs={pairs} featuredCars={comparison?.cars ?? []} options={options} />;
}

async function ArticlesData() {
  const articles = await getHomeArticles();
  return <Articles articles={articles} />;
}

async function ReviewsData() {
  const testimonials = await getHomeTestimonials();
  return <Reviews testimonials={testimonials} />;
}

async function StoriesData() {
  const groups = await getHomeStories();
  return <Stories groups={groups} />;
}

async function HomeJsonLd() {
  const seo = await getSeoMeta({ pageType: SEO_PAGE_TYPE.STATIC, staticPageSlug: "home" });
  return <SeoJsonLd schemas={[...getAllSchemas(seo), buildSiteSchema(SITE_URL, "TimesAuto")]} />;
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-page">
      <Suspense fallback={null}>
        <HomeJsonLd />
      </Suspense>
      <Suspense fallback={<SectionSkeleton minHeight={560} />}>
        <HeroSectionData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <PopularBrandsData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <GuidedDiscoveryData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <CuratedCarsData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton minHeight={760} />}>
        <ElectricCarsData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <UpcomingLaunchesData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <CompareCarsData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <StoriesData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <ArticlesData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <ReviewsData />
      </Suspense>
    </div>
  );
}

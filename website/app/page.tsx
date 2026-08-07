import { Suspense } from "react";
import HeroSection from "@/components/home/HeroSection";
import CuratedCars from "@/components/home/CuratedCars";
import PopularBrands from "@/components/home/PopularBrands";
import BodyTypes from "@/components/home/BodyTypes";
import UpcomingLaunches from "@/components/home/UpcomingLaunches";
import CompareCars from "@/components/home/Comparecars";
import Stories from "@/components/home/Stories";
import Articles from "@/components/home/Articles";
import Reviews from "@/components/home/Reviews";
import SectionSkeleton from "@/components/common/SectionSkeleton";
import { getBanners } from "@/features/banners/banner.api";
import { getBrands } from "@/features/brands/brand.api";
import { getHomeCars } from "@/features/cars/car.api";
import { getHomeArticles } from "@/features/articles/article.api";
import { getHomeTestimonials } from "@/features/testimonials/testimonial.api";
import { getHomeStories } from "@/features/stories/story.api";
import { getBodyTypes } from "@/features/bodyTypes/bodyType.api";
import { getRandomPairs } from "@/features/compare/compare.api";

// Each of these is its own async Server Component, fetching only the data
// its section needs. Wrapping each one in its own <Suspense> below means a
// slow section (e.g. Reviews) never blocks a fast one (e.g. Hero) from
// showing up first — sections stream in as their data resolves instead of
// the whole page waiting on the slowest fetch.

async function HeroSectionData() {
  // getBodyTypes() is called again in BodyTypesData below — same URL/
  // revalidate window, so Next.js dedupes it into one request, not two.
  const [banners, bodyTypes] = await Promise.all([getBanners(), getBodyTypes()]);
  return <HeroSection banners={banners} bodyTypes={bodyTypes} />;
}

async function PopularBrandsData() {
  const brands = await getBrands();
  return <PopularBrands brands={brands} />;
}

async function BodyTypesData() {
  const bodyTypes = await getBodyTypes();
  return <BodyTypes bodyTypes={bodyTypes} />;
}

async function CuratedCarsData() {
  const cars = await getHomeCars("latest", 4);
  return <CuratedCars initialCars={cars} />;
}

async function UpcomingLaunchesData() {
  const cars = await getHomeCars("upcoming");
  return <UpcomingLaunches cars={cars} />;
}

async function CompareCarsData() {
  const { pairs } = await getRandomPairs({ count: 6 });
  return <CompareCars pairs={pairs} />;
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-page">
      <Suspense fallback={<SectionSkeleton minHeight={560} />}>
        <HeroSectionData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <PopularBrandsData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <BodyTypesData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <CuratedCarsData />
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

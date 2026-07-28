import { Suspense } from "react";
import HeroSection from "@/components/home/HeroSection";
import PopularBrands from "@/components/home/PopularBrands";
import BodyTypes from "@/components/home/BodyTypes";
import UpcomingLaunches from "@/components/home/UpcomingLaunches";
import LatestCars from "@/components/home/LatestCars";
import PopularCars from "@/components/home/Popularcars";
import ElectricCars from "@/components/home/Electriccars";
import CompareCars from "@/components/home/Comparecars";
import Stories from "@/components/home/Stories";
import Articles from "@/components/home/Articles";
import TrustedUsedCars from "@/components/home/Trustedusedcars";
import Reviews from "@/components/home/Reviews";
import SectionSkeleton from "@/components/common/SectionSkeleton";
import { getBanners } from "@/features/banners/banner.api";
import { getBrands } from "@/features/brands/brand.api";
import { getHomeCars } from "@/features/cars/car.api";
import { getHomeCities } from "@/features/cities/city.api";
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

async function LatestCarsData() {
  const cars = await getHomeCars("latest");
  return <LatestCars cars={cars} />;
}

async function PopularCarsData() {
  const cars = await getHomeCars("popular");
  return <PopularCars cars={cars} />;
}

async function UpcomingLaunchesData() {
  const cars = await getHomeCars("upcoming");
  return <UpcomingLaunches cars={cars} />;
}

async function ElectricCarsData() {
  const cars = await getHomeCars("electric");
  return <ElectricCars cars={cars} />;
}

async function CompareCarsData() {
  const { pairs } = await getRandomPairs({ count: 6 });
  return <CompareCars pairs={pairs} />;
}

async function TrustedUsedCarsData() {
  const cities = await getHomeCities();
  return <TrustedUsedCars cities={cities} />;
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
        <LatestCarsData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <PopularCarsData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <UpcomingLaunchesData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <ElectricCarsData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <CompareCarsData />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <TrustedUsedCarsData />
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

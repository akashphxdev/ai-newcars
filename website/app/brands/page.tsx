import type { Metadata } from "next";
import { getStaticPageMetadata } from "@/features/seo/seo.api";
import PageSidebar from "@/components/common/PageSidebar";
import { routes } from "@/lib/routes";
import { getAllBrands } from "@/features/brands/brand.api";
import BrandsHero from "@/components/brands/BrandsHero";
import BrandsGrid from "@/components/brands/BrandsGrid";

export async function generateMetadata(): Promise<Metadata> {
  return getStaticPageMetadata(
    "brands",
    { title: "All Car Brands in India | TimesAuto", description: "Browse every car brand available in India — explore models, prices, and specs by manufacturer." },
    "/brands",
  );
}

export default async function BrandsPage() {
  const brands = await getAllBrands();

  return (
    <div>
      <BrandsHero />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <p className="max-w-2xl text-muted">
          Browse all {brands.length} car manufacturers available in India, from mass-market favorites to premium and
          luxury marques. Pick a brand to see its full model lineup, on-road prices, specs, and the latest offers.
        </p>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <BrandsGrid brands={brands} />
          </div>
          <div className="w-full lg:w-[300px] lg:shrink-0">
            <PageSidebar
              adSlotId="brands"
              blocks={[
                {
                  title: "Browse by",
                  links: [
                    { href: routes.newCars(), label: "All new cars", note: "Every model on sale" },
                    { href: routes.electricCars(), label: "Electric cars", note: "EVs on sale now" },
                    { href: routes.upcomingCars(), label: "Upcoming cars", note: "What is launching next" },
                    { href: routes.compare(), label: "Compare cars", note: "Two models side by side" },
                  ],
                },
                {
                  title: "Work out the cost",
                  links: [
                    { href: routes.emiCalculator(), label: "Car loan EMI", note: "What it costs a month" },
                    { href: routes.affordabilityCalculator(), label: "Affordability", note: "What your budget reaches" },
                    { href: routes.fuelPrice(), label: "Fuel prices", note: "Today, in your city" },
                  ],
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

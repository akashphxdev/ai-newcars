import type { Metadata } from "next";
import { getAllBrands } from "@/features/brands/brand.api";
import BrandsHero from "@/components/brands/BrandsHero";
import BrandsGrid from "@/components/brands/BrandsGrid";

export const metadata: Metadata = {
  title: "All Car Brands in India | TimesAuto",
  description: "Browse every car brand available in India — explore models, prices, and specs by manufacturer.",
};

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

        <div className="mt-8">
          <BrandsGrid brands={brands} />
        </div>
      </div>
    </div>
  );
}

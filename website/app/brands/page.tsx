import type { Metadata } from "next";
import { getAllBrands } from "@/features/brands/brand.api";
import { getAllSchemas, getSeoMeta, getStaticPageMetadata } from "@/features/seo/seo.api";
import { SEO_PAGE_TYPE } from "@/features/seo/seo.types";
import BrandsHero from "@/components/brands/BrandsHero";
import BrandsGrid from "@/components/brands/BrandsGrid";
import SeoJsonLd from "@/components/common/SeoJsonLd";

export async function generateMetadata(): Promise<Metadata> {
  return getStaticPageMetadata(
    "brands",
    {
      title: "All Car Brands in India | TimesAuto",
      description: "Browse every car brand available in India — explore models, prices, and specs by manufacturer.",
    },
    "/brands",
  );
}

export default async function BrandsPage() {
  const [brands, seo] = await Promise.all([
    getAllBrands(),
    getSeoMeta({ pageType: SEO_PAGE_TYPE.STATIC, staticPageSlug: "brands" }),
  ]);

  return (
    <div>
      <SeoJsonLd schemas={getAllSchemas(seo)} />
      <BrandsHero h1Override={seo?.h1Tag} />

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

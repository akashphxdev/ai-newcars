import type { Metadata } from "next";
import Link from "next/link";
import { getBodyTypes } from "@/features/bodyTypes/bodyType.api";
import CarAffordabilityCalculatorClient from "@/components/calculators/CarAffordabilityCalculatorClient";
import CarAffordabilityFormulaExplainer from "@/components/calculators/CarAffordabilityFormulaExplainer";
import CarAffordabilityFaq from "@/components/calculators/CarAffordabilityFaq";
import { getAllSchemas, getSeoMeta, getStaticPageMetadata } from "@/features/seo/seo.api";
import { SEO_PAGE_TYPE } from "@/features/seo/seo.types";
import SeoJsonLd from "@/components/common/SeoJsonLd";

export async function generateMetadata(): Promise<Metadata> {
  return getStaticPageMetadata(
    "car-affordability-calculator",
    {
      title: "Car Affordability Calculator | TimesAuto",
      description: "Find out what car fits your budget — enter your monthly EMI budget and down payment to see the maximum car price you can afford, and browse real cars within that budget.",
    },
    "/car-affordability-calculator",
  );
}

export default async function CarAffordabilityCalculatorPage() {
  const [bodyTypes, seo] = await Promise.all([
    getBodyTypes(20),
    getSeoMeta({ pageType: SEO_PAGE_TYPE.STATIC, staticPageSlug: "car-affordability-calculator" }),
  ]);

  return (
    <div>
      <SeoJsonLd schemas={getAllSchemas(seo)} />
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <nav className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold" aria-label="Breadcrumb">
            <Link href="/" className="text-ink">
              Home
            </Link>
            <span className="text-muted">{">"}</span>
            <span className="text-ink">Tools</span>
            <span className="text-muted">{">"}</span>
            <span className="text-brand">Car Affordability Calculator</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{seo?.h1Tag || "Car Affordability Calculator"}</h1>
          <p className="mt-2 max-w-2xl text-[14.5px] font-medium text-muted">
            Tell us your budget — we&apos;ll show you what car you can afford.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <CarAffordabilityCalculatorClient bodyTypes={bodyTypes} />
        <CarAffordabilityFormulaExplainer />
        <CarAffordabilityFaq />
      </div>
    </div>
  );
}

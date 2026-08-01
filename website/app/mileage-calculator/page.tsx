import type { Metadata } from "next";
import Link from "next/link";
import { getAllBrands } from "@/features/brands/brand.api";
import MileageCalculatorClient from "@/components/calculators/MileageCalculatorClient";
import MileageFormulaExplainer from "@/components/calculators/MileageFormulaExplainer";
import MileageCalculatorFaq from "@/components/calculators/MileageCalculatorFaq";

export const metadata: Metadata = {
  title: "Car Mileage Calculator | TimesAuto",
  description: "Calculate your car's mileage and running cost per km — pick any brand, model and variant, enter today's fuel price to see your daily, monthly and yearly running cost.",
};

export default async function MileageCalculatorPage() {
  const brands = await getAllBrands();

  return (
    <div>
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <nav className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold" aria-label="Breadcrumb">
            <Link href="/" className="text-ink">
              Home
            </Link>
            <span className="text-muted">{">"}</span>
            <span className="text-ink">Tools</span>
            <span className="text-muted">{">"}</span>
            <span className="text-brand">Mileage Calculator</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Mileage Calculator</h1>
          <p className="mt-2 max-w-2xl text-[14.5px] font-medium text-muted">
            Calculate your car&apos;s mileage and running cost per km.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <MileageCalculatorClient brands={brands} />
        <MileageFormulaExplainer />
        <MileageCalculatorFaq />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getAllBrands } from "@/features/brands/brand.api";
import EmiCalculatorClient from "@/components/calculators/EmiCalculatorClient";
import EmiFormulaExplainer from "@/components/calculators/EmiFormulaExplainer";
import EmiCalculatorFaq from "@/components/calculators/EmiCalculatorFaq";

export const metadata: Metadata = {
  title: "Car EMI Calculator | TimesAuto",
  description:
    "Calculate your monthly car loan EMI — pick any brand, model and variant, adjust down payment, interest rate and tenure to plan your car purchase.",
};

export default async function EmiCalculatorPage() {
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
            <span className="text-brand">EMI Calculator</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Car EMI Calculator</h1>
          <p className="mt-2 max-w-2xl text-[14.5px] font-medium text-muted">
            Calculate your monthly EMI and plan your car purchase better with our easy EMI calculator.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <EmiCalculatorClient brands={brands} />
        <EmiFormulaExplainer />
        <EmiCalculatorFaq />
      </div>
    </div>
  );
}

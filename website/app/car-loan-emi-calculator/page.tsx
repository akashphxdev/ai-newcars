import type { Metadata } from "next";
import { getStaticPageMetadata } from "@/features/seo/seo.api";
import { getAllBrands } from "@/features/brands/brand.api";
import { getVariantsByModel } from "@/features/calculators/emiCalculator.api";
import { leadCarSeed } from "@/features/calculators/calculatorSeed";
import EmiCalculatorClient from "@/components/calculators/EmiCalculatorClient";
import EmiFormulaExplainer from "@/components/calculators/EmiFormulaExplainer";
import EmiCalculatorFaq from "@/components/calculators/EmiCalculatorFaq";
import CalculatorPageShell from "@/components/calculators/CalculatorPageShell";

export async function generateMetadata(): Promise<Metadata> {
  return getStaticPageMetadata(
    "car-loan-emi-calculator",
    { title: "Car EMI Calculator | TimesAuto", description: "Calculate your monthly car loan EMI — pick any brand, model and variant, adjust down payment, interest rate and tenure to plan your car purchase." },
    "/car-loan-emi-calculator",
  );
}

export default async function EmiCalculatorPage() {
  const [brands, seed] = await Promise.all([getAllBrands(), leadCarSeed(getVariantsByModel)]);

  return (
    <CalculatorPageShell
      eyebrow="Smart finance"
      title="Plan your car loan with confidence"
      description="Estimate your monthly EMI, compare the true cost of borrowing, and shape a repayment plan around your budget."
      breadcrumb="Car Loan EMI Calculator"
      path="/car-loan-emi-calculator"
      belowFold={
        <>
          <EmiFormulaExplainer />
          <EmiCalculatorFaq />
        </>
      }
    >
      <EmiCalculatorClient brands={brands} seed={seed} />
    </CalculatorPageShell>
  );
}

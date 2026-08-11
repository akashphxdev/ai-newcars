import type { Metadata } from "next";
import { getStaticPageMetadata } from "@/features/seo/seo.api";
import { getAllBrands } from "@/features/brands/brand.api";
import { getVariantsByModel } from "@/features/calculators/mileageCalculator.api";
import { leadCarSeed } from "@/features/calculators/calculatorSeed";
import MileageCalculatorClient from "@/components/calculators/MileageCalculatorClient";
import MileageFormulaExplainer from "@/components/calculators/MileageFormulaExplainer";
import MileageCalculatorFaq from "@/components/calculators/MileageCalculatorFaq";
import CalculatorPageShell from "@/components/calculators/CalculatorPageShell";

export async function generateMetadata(): Promise<Metadata> {
  return getStaticPageMetadata(
    "mileage-calculator",
    { title: "Car Mileage Calculator | TimesAuto", description: "Calculate your car's mileage and running cost per km — pick any brand, model and variant, enter today's fuel price to see your daily, monthly and yearly running cost." },
    "/mileage-calculator",
  );
}

export default async function MileageCalculatorPage() {
  const [brands, seed] = await Promise.all([getAllBrands(), leadCarSeed(getVariantsByModel)]);

  return (
    <CalculatorPageShell
      eyebrow="Real-world running cost"
      title="Know what every kilometre costs"
      description="Use your car's mileage and local fuel price to understand daily, monthly, and yearly running costs."
      breadcrumb="Car Mileage Calculator"
      path="/mileage-calculator"
      belowFold={
        <>
          <MileageFormulaExplainer />
          <MileageCalculatorFaq />
        </>
      }
    >
      <MileageCalculatorClient brands={brands} seed={seed} />
    </CalculatorPageShell>
  );
}

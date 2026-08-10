import type { Metadata } from "next";
import { getAllBrands } from "@/features/brands/brand.api";
import { getVariantsByModel } from "@/features/calculators/mileageCalculator.api";
import { leadCarSeed } from "@/features/calculators/calculatorSeed";
import MileageCalculatorClient from "@/components/calculators/MileageCalculatorClient";
import MileageFormulaExplainer from "@/components/calculators/MileageFormulaExplainer";
import MileageCalculatorFaq from "@/components/calculators/MileageCalculatorFaq";
import CalculatorPageShell from "@/components/calculators/CalculatorPageShell";

export const metadata: Metadata = {
  title: "Car Mileage Calculator | TimesAuto",
  description: "Calculate your car's mileage and running cost per km — pick any brand, model and variant, enter today's fuel price to see your daily, monthly and yearly running cost.",
};

export default async function MileageCalculatorPage() {
  const [brands, seed] = await Promise.all([getAllBrands(), leadCarSeed(getVariantsByModel)]);

  return (
    <CalculatorPageShell
      eyebrow="Real-world running cost"
      title="Know what every kilometre costs"
      description="Use your car's mileage and local fuel price to understand daily, monthly, and yearly running costs."
      breadcrumb="Car Mileage Calculator"
      path="/mileage-calculator"
    >
      <MileageCalculatorClient brands={brands} seed={seed} />
      <MileageFormulaExplainer />
      <MileageCalculatorFaq />
    </CalculatorPageShell>
  );
}

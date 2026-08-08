import type { Metadata } from "next";
import { getAllBrands } from "@/features/brands/brand.api";
import { leadModelSeed } from "@/features/calculators/calculatorSeed";
import FuelComparisonCalculatorClient from "@/components/calculators/FuelComparisonCalculatorClient";
import FuelComparisonCalculatorFaq from "@/components/calculators/FuelComparisonCalculatorFaq";
import CalculatorPageShell from "@/components/calculators/CalculatorPageShell";

export const metadata: Metadata = {
  title: "Petrol vs Diesel vs CNG vs EV Running Cost Comparison | TimesAuto",
  description: "Compare the running cost of a car's Petrol, Diesel, CNG and Electric versions side-by-side, using each variant's own real mileage and your fuel prices.",
};

export default async function FuelComparisonCalculatorPage() {
  const [brands, seed] = await Promise.all([getAllBrands(), leadModelSeed()]);

  return (
    <CalculatorPageShell
      eyebrow="Running cost comparison"
      title="Which fuel fits the way you drive?"
      description="Compare real monthly running costs for every fuel type available on the same car."
      breadcrumb="Fuel Type Comparison"
    >
      <FuelComparisonCalculatorClient brands={brands} seed={seed} />
      <FuelComparisonCalculatorFaq />
    </CalculatorPageShell>
  );
}

import type { Metadata } from "next";
import { getBodyTypes } from "@/features/bodyTypes/bodyType.api";
import CarAffordabilityCalculatorClient from "@/components/calculators/CarAffordabilityCalculatorClient";
import CarAffordabilityFormulaExplainer from "@/components/calculators/CarAffordabilityFormulaExplainer";
import CarAffordabilityFaq from "@/components/calculators/CarAffordabilityFaq";
import CalculatorPageShell from "@/components/calculators/CalculatorPageShell";

export const metadata: Metadata = {
  title: "Car Affordability Calculator | TimesAuto",
  description: "Find out what car fits your budget — enter your monthly EMI budget and down payment to see the maximum car price you can afford, and browse real cars within that budget.",
};

export default async function CarAffordabilityCalculatorPage() {
  const bodyTypes = await getBodyTypes(20);

  return (
    <CalculatorPageShell
      eyebrow="Buy within your means"
      title="Turn your monthly budget into the right car"
      description="See the car price your EMI and down payment can support, then browse real models that fit."
      breadcrumb="Car Affordability Calculator"
    >
      <CarAffordabilityCalculatorClient bodyTypes={bodyTypes} />
      <CarAffordabilityFormulaExplainer />
      <CarAffordabilityFaq />
    </CalculatorPageShell>
  );
}

import type { Metadata } from "next";
import { getStaticPageMetadata } from "@/features/seo/seo.api";
import { getBodyTypes } from "@/features/bodyTypes/bodyType.api";
import CarAffordabilityCalculatorClient from "@/components/calculators/CarAffordabilityCalculatorClient";
import CarAffordabilityFormulaExplainer from "@/components/calculators/CarAffordabilityFormulaExplainer";
import CarAffordabilityFaq from "@/components/calculators/CarAffordabilityFaq";
import CalculatorPageShell from "@/components/calculators/CalculatorPageShell";

export async function generateMetadata(): Promise<Metadata> {
  return getStaticPageMetadata(
    "car-affordability-calculator",
    { title: "Car Affordability Calculator | TimesAuto", description: "Find out what car fits your budget — enter your monthly EMI budget and down payment to see the maximum car price you can afford, and browse real cars within that budget." },
    "/car-affordability-calculator",
  );
}

export default async function CarAffordabilityCalculatorPage() {
  const bodyTypes = await getBodyTypes(20);

  return (
    <CalculatorPageShell
      eyebrow="Buy within your means"
      title="Turn your monthly budget into the right car"
      description="See the car price your EMI and down payment can support, then browse real models that fit."
      breadcrumb="Car Affordability Calculator"
      path="/car-affordability-calculator"
      belowFold={
        <>
          <CarAffordabilityFormulaExplainer />
          <CarAffordabilityFaq />
        </>
      }
    >
      <CarAffordabilityCalculatorClient bodyTypes={bodyTypes} />
    </CalculatorPageShell>
  );
}

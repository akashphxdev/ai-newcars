import type { Metadata } from "next";
import { getAllBrands } from "@/features/brands/brand.api";
import { getVariantsByModel } from "@/features/calculators/mileageCalculator.api";
import { leadCarSeed } from "@/features/calculators/calculatorSeed";
import EvChargingCalculatorClient from "@/components/calculators/EvChargingCalculatorClient";
import EvChargingCalculatorFaq from "@/components/calculators/EvChargingCalculatorFaq";
import CalculatorPageShell from "@/components/calculators/CalculatorPageShell";

export const metadata: Metadata = {
  title: "EV Charging Time Calculator | TimesAuto",
  description: "Calculate how long your electric car takes to charge — pick any EV, choose AC or DC fast charging and a charge range, using the car's own real battery and charging specs.",
};

export default async function EvChargingCalculatorPage() {
  const [brands, seed] = await Promise.all([getAllBrands(), leadCarSeed(getVariantsByModel, "electric")]);

  return (
    <CalculatorPageShell
      eyebrow="EV charge planner"
      title="Plan every charge before you plug in"
      description="Choose your battery range and charger to compare AC and DC charging time for your EV."
      breadcrumb="EV Charging Time Calculator"
      path="/ev-charging-time-calculator"
      accent="ev"
    >
      <EvChargingCalculatorClient brands={brands} seed={seed} />
      <EvChargingCalculatorFaq />
    </CalculatorPageShell>
  );
}

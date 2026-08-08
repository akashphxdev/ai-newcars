import type { Metadata } from "next";
import { getAllBrands } from "@/features/brands/brand.api";
import { getVariantsByModel } from "@/features/calculators/emiCalculator.api";
import { leadCarSeed } from "@/features/calculators/calculatorSeed";
import DownPaymentCalculatorClient from "@/components/calculators/DownPaymentCalculatorClient";
import CalculatorPageShell from "@/components/calculators/CalculatorPageShell";
import DownPaymentCalculatorFaq from "@/components/calculators/DownPaymentCalculatorFaq";

export const metadata: Metadata = {
  title: "Car Down Payment Calculator | TimesAuto",
  description: "Find out how much down payment you need for your desired monthly EMI — pick any car, set your target EMI, interest rate and tenure to see the down payment required.",
};

export default async function DownPaymentCalculatorPage() {
  const [brands, seed] = await Promise.all([getAllBrands(), leadCarSeed(getVariantsByModel)]);

  return (
    <CalculatorPageShell
      eyebrow="Plan the upfront cost"
      title="How much should you put down?"
      description="Set a comfortable monthly EMI and see the cash you need before you choose a loan."
      breadcrumb="Car Down Payment Calculator"
    >
      <DownPaymentCalculatorClient brands={brands} seed={seed} />
      <DownPaymentCalculatorFaq />
    </CalculatorPageShell>
  );
}

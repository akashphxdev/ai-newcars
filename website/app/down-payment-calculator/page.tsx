import type { Metadata } from "next";
import { getStaticPageMetadata } from "@/features/seo/seo.api";
import { getAllBrands } from "@/features/brands/brand.api";
import { getVariantsByModel } from "@/features/calculators/emiCalculator.api";
import { leadCarSeed } from "@/features/calculators/calculatorSeed";
import DownPaymentCalculatorClient from "@/components/calculators/DownPaymentCalculatorClient";
import CalculatorPageShell from "@/components/calculators/CalculatorPageShell";
import DownPaymentCalculatorFaq from "@/components/calculators/DownPaymentCalculatorFaq";

export async function generateMetadata(): Promise<Metadata> {
  return getStaticPageMetadata(
    "down-payment-calculator",
    { title: "Car Down Payment Calculator | TimesAuto", description: "Find out how much down payment you need for your desired monthly EMI — pick any car, set your target EMI, interest rate and tenure to see the down payment required." },
    "/down-payment-calculator",
  );
}

export default async function DownPaymentCalculatorPage() {
  const [brands, seed] = await Promise.all([getAllBrands(), leadCarSeed(getVariantsByModel)]);

  return (
    <CalculatorPageShell
      eyebrow="Plan the upfront cost"
      title="How much should you put down?"
      description="Set a comfortable monthly EMI and see the cash you need before you choose a loan."
      breadcrumb="Car Down Payment Calculator"
      path="/down-payment-calculator"
      belowFold={
        <>
          <DownPaymentCalculatorFaq />
        </>
      }
    >
      <DownPaymentCalculatorClient brands={brands} seed={seed} />
    </CalculatorPageShell>
  );
}

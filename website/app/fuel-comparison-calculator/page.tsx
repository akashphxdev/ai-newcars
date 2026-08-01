import type { Metadata } from "next";
import Link from "next/link";
import { getAllBrands } from "@/features/brands/brand.api";
import FuelComparisonCalculatorClient from "@/components/calculators/FuelComparisonCalculatorClient";
import FuelComparisonCalculatorFaq from "@/components/calculators/FuelComparisonCalculatorFaq";

export const metadata: Metadata = {
  title: "Petrol vs Diesel vs CNG vs EV Running Cost Comparison | TimesAuto",
  description: "Compare the running cost of a car's Petrol, Diesel, CNG and Electric versions side-by-side, using each variant's own real mileage and your fuel prices.",
};

export default async function FuelComparisonCalculatorPage() {
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
            <span className="text-brand">Fuel Type Comparison</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Petrol vs Diesel vs CNG vs EV — Running Cost</h1>
          <p className="mt-2 max-w-2xl text-[14.5px] font-medium text-muted">
            Compare a car&apos;s fuel-type options side-by-side and see which one actually costs less to run.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <FuelComparisonCalculatorClient brands={brands} />
        <FuelComparisonCalculatorFaq />
      </div>
    </div>
  );
}

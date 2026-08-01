import type { Metadata } from "next";
import Link from "next/link";
import { getAllBrands } from "@/features/brands/brand.api";
import EvChargingCalculatorClient from "@/components/calculators/EvChargingCalculatorClient";
import EvChargingCalculatorFaq from "@/components/calculators/EvChargingCalculatorFaq";

export const metadata: Metadata = {
  title: "EV Charging Time Calculator | TimesAuto",
  description: "Calculate how long your electric car takes to charge — pick any EV, choose AC or DC fast charging and a charge range, using the car's own real battery and charging specs.",
};

export default async function EvChargingCalculatorPage() {
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
            <span className="text-brand">EV Charging Time Calculator</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">EV Charging Time Calculator</h1>
          <p className="mt-2 max-w-2xl text-[14.5px] font-medium text-muted">
            Find out how long your electric car takes to charge, on AC or DC fast charging.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <EvChargingCalculatorClient brands={brands} />
        <EvChargingCalculatorFaq />
      </div>
    </div>
  );
}

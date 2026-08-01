import type { Metadata } from "next";
import Link from "next/link";
import { getAllBrands } from "@/features/brands/brand.api";
import DownPaymentCalculatorClient from "@/components/calculators/DownPaymentCalculatorClient";

export const metadata: Metadata = {
  title: "Car Down Payment Calculator | TimesAuto",
  description: "Find out how much down payment you need for your desired monthly EMI — pick any car, set your target EMI, interest rate and tenure to see the down payment required.",
};

export default async function DownPaymentCalculatorPage() {
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
            <span className="text-brand">Down Payment Calculator</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Down Payment Calculator</h1>
          <p className="mt-2 max-w-2xl text-[14.5px] font-medium text-muted">
            Set your target monthly EMI and find out how much down payment you&apos;ll need.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <DownPaymentCalculatorClient brands={brands} />
      </div>
    </div>
  );
}

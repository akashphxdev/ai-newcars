"use client";
import { useState } from "react";
import Link from "next/link";
import PriceDropAlertModal from "@/components/leads/PriceDropAlertModal";
import InsuranceLeadModal from "@/components/leads/InsuranceLeadModal";
import LoanLeadModal from "@/components/leads/LoanLeadModal";
import { BellIcon, ShieldIcon, PercentIcon, CalculatorIcon } from "@/components/common/icons";
import { submitPriceDropAlertLead, submitInsuranceLead, submitLoanLead } from "@/features/leads/lead.api";

type ActiveModal = "price-drop" | "insurance" | "loan" | null;

// Utility row below the dark price card — Price Drop Alert, Insurance
// Quote, Apply for Loan (each a modal), plus a plain Calculate EMI link
// out to the calculator page. See CarLeadActions for the primary
// Check Offers/Enquire Now CTAs, split out since those live inside the
// price card and these live below it.
export default function CarLeadSecondaryActions({
  brandId,
  brandName,
  modelId,
  carName,
  imageUrl,
}: {
  brandId: number;
  brandName: string;
  modelId: number;
  carName: string;
  imageUrl: string | null;
}) {
  const [active, setActive] = useState<ActiveModal>(null);

  return (
    <>
      <div className="flex items-stretch divide-x divide-border rounded-2xl border border-border bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setActive("price-drop")}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 px-2 py-3.5 text-[12.5px] font-semibold text-ink transition-colors hover:text-brand"
        >
          <BellIcon className="size-4 text-muted" /> Price Drop Alert
        </button>
        <button
          type="button"
          onClick={() => setActive("insurance")}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 px-2 py-3.5 text-[12.5px] font-semibold text-ink transition-colors hover:text-brand"
        >
          <ShieldIcon className="size-4 text-muted" /> Insurance Quote
        </button>
        <Link
          href="/car-loan-emi-calculator"
          className="flex flex-1 items-center justify-center gap-1.5 px-2 py-3.5 text-[12.5px] font-bold text-brand"
        >
          <CalculatorIcon className="size-4" /> Calculate EMI
        </Link>
        <button
          type="button"
          onClick={() => setActive("loan")}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 px-2 py-3.5 text-[12.5px] font-semibold text-ink transition-colors hover:text-brand"
        >
          <PercentIcon className="size-4 text-muted" /> Apply for Loan
        </button>
      </div>

      {active === "price-drop" && (
        <PriceDropAlertModal
          carName={carName}
          imageUrl={imageUrl}
          onClose={() => setActive(null)}
          onSubmit={async (values) => {
            await submitPriceDropAlertLead({ ...values, brandId, modelId });
          }}
        />
      )}

      {active === "insurance" && (
        <InsuranceLeadModal
          brandName={brandName}
          carName={carName}
          modelId={modelId}
          imageUrl={imageUrl}
          onClose={() => setActive(null)}
          onSubmit={async (values) => {
            await submitInsuranceLead({ ...values, brandId, modelId });
          }}
        />
      )}

      {active === "loan" && (
        <LoanLeadModal
          brandName={brandName}
          carName={carName}
          modelId={modelId}
          imageUrl={imageUrl}
          onClose={() => setActive(null)}
          onSubmit={async (values) => {
            await submitLoanLead({ ...values, brandId, modelId });
          }}
        />
      )}
    </>
  );
}

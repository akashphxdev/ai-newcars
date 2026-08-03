"use client";
import { useState } from "react";
import NewCarLeadModal from "@/components/leads/NewCarLeadModal";
import PriceDropAlertModal from "@/components/leads/PriceDropAlertModal";
import InsuranceLeadModal from "@/components/leads/InsuranceLeadModal";
import LoanLeadModal from "@/components/leads/LoanLeadModal";
import { BellIcon, ShieldIcon, PercentIcon } from "@/components/common/icons";
import { submitBuyNewCarLead, submitPriceDropAlertLead, submitInsuranceLead, submitLoanLead } from "@/features/leads/lead.api";
import type { BuyNewCarLeadInterestType } from "@/features/leads/lead.types";

type ActiveModal = BuyNewCarLeadInterestType | "price-drop" | "insurance" | "loan" | null;

// Client island for CarModelHero's CTAs — the rest of that component
// stays a server component; only these buttons + their modal state need
// to run client-side.
export default function CarLeadActions({
  brandId,
  brandName,
  modelId,
  variantId,
  carName,
  imageUrl,
  priceLabel,
}: {
  brandId: number;
  brandName: string;
  modelId: number;
  variantId: number;
  carName: string;
  imageUrl: string | null;
  priceLabel: string;
}) {
  const [active, setActive] = useState<ActiveModal>(null);

  return (
    <>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={() => setActive("offer_check")}
          className="w-full cursor-pointer rounded-xl border-[1.5px] border-brand px-5 py-3 text-center text-[13.5px] font-bold text-brand transition-colors hover:bg-orange-50"
        >
          Check Offers
        </button>
        <button
          type="button"
          onClick={() => setActive("enquiry")}
          className="w-full cursor-pointer rounded-xl border-[1.5px] border-border px-5 py-3 text-center text-[13.5px] font-bold text-ink transition-colors hover:border-brand hover:text-brand"
        >
          Enquire Now
        </button>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={() => setActive("price-drop")}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-center text-[12.5px] font-bold text-ink transition-colors hover:border-brand hover:text-brand"
        >
          <BellIcon className="size-3.5" /> Notify me if the price drops
        </button>
        <button
          type="button"
          onClick={() => setActive("insurance")}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-center text-[12.5px] font-bold text-ink transition-colors hover:border-brand hover:text-brand"
        >
          <ShieldIcon className="size-3.5" /> Get Insurance Quote
        </button>
        <button
          type="button"
          onClick={() => setActive("loan")}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-center text-[12.5px] font-bold text-ink transition-colors hover:border-brand hover:text-brand"
        >
          <PercentIcon className="size-3.5" /> Apply for Loan
        </button>
      </div>

      {(active === "enquiry" || active === "offer_check") && (
        <NewCarLeadModal
          interestType={active}
          carName={carName}
          imageUrl={imageUrl}
          priceLabel={priceLabel}
          onClose={() => setActive(null)}
          onSubmit={async (values) => {
            await submitBuyNewCarLead({ ...values, brandId, modelId, variantId, interestType: active });
          }}
        />
      )}

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

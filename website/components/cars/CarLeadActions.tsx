"use client";
import { useState } from "react";
import NewCarLeadModal from "@/components/leads/NewCarLeadModal";
import { submitBuyNewCarLead } from "@/features/leads/lead.api";
import type { BuyNewCarLeadInterestType } from "@/features/leads/lead.types";

type ActiveModal = BuyNewCarLeadInterestType | null;

// Client island for CarModelHero's "Check Offers" trigger, rendered
// inline next to the price — the rest of that component stays a server
// component; only this button + its modal state need to run client-side.
// Price Drop/Insurance/Loan/EMI live in CarLeadSecondaryActions, rendered
// below the gallery instead.
export default function CarLeadActions({
  brandId,
  modelId,
  variantId,
  carName,
  imageUrl,
  priceLabel,
}: {
  brandId: number;
  modelId: number;
  variantId: number;
  carName: string;
  imageUrl: string | null;
  priceLabel: string;
}) {
  const [active, setActive] = useState<ActiveModal>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setActive("offer_check")}
        className="cursor-pointer text-[14px] font-bold text-brand hover:underline"
      >
        Check Offers
      </button>

      {active && (
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
    </>
  );
}

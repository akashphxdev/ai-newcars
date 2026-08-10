// components/calculators/AffordabilityVerdict.tsx
//
// The page answers "what can I buy for this EMI". The trap it walks the
// reader into is that the EMI is not the cost of the car — it is the cost
// of the loan. Registration is paid once at the start and insurance comes
// back every year, and neither is in the number the tool just returned.
//
// So this states what the budget really commits to: what the finance adds
// over the term, and what the car asks for again each year afterwards.

"use client";

import { formatRupee } from "@/lib/calculatorFormat";

// Same share the on-road endpoint uses for first-year comprehensive cover.
// It is not a published rate — it moves with insurer, IDV and add-ons — so
// it is always presented as an estimate.
const INSURANCE_RATE = 0.035;

export default function AffordabilityVerdict({
  maxCarPrice,
  maxLoan,
  monthlyEmi,
  tenureYears,
}: {
  maxCarPrice: number;
  maxLoan: number;
  monthlyEmi: number;
  tenureYears: number;
}) {
  if (maxCarPrice <= 0 || monthlyEmi <= 0) return null;

  const totalPaidToLender = monthlyEmi * tenureYears * 12;
  const financeCost = totalPaidToLender - maxLoan;
  const yearlyInsurance = maxCarPrice * INSURANCE_RATE;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-[13.5px] font-bold text-ink">What the budget really commits to</h3>

      <div className="mt-3 space-y-2.5">
        <p className="text-[12.5px] leading-relaxed text-muted">
          <span className="font-semibold text-ink">{formatRupee(financeCost)}</span> of that budget
          goes to the lender rather than the car — you repay{" "}
          <span className="font-semibold text-ink">{formatRupee(totalPaidToLender)}</span> on{" "}
          {formatRupee(maxLoan)} borrowed.
        </p>
        <p className="text-[12.5px] leading-relaxed text-muted">
          Insurance on a car this price runs about{" "}
          <span className="font-semibold text-ink">{formatRupee(yearlyInsurance)}</span> a year, and
          renews long after the loan is finished.
        </p>
      </div>

      <p className="mt-3.5 rounded-xl bg-page p-3.5 text-[12.5px] leading-relaxed text-ink">
        The EMI is the cost of the loan, not the cost of the car. Road tax and registration are due
        upfront, insurance comes back yearly, and fuel and servicing run alongside — none of which
        is in the figure above.
      </p>

      <p className="mt-3 text-[10.5px] leading-relaxed text-subtle">
        Insurance estimated at {(INSURANCE_RATE * 100).toFixed(1)}% of ex-showroom, the same
        assumption the on-road price uses. Your actual premium depends on insurer, cover and
        claims history.
      </p>
    </div>
  );
}

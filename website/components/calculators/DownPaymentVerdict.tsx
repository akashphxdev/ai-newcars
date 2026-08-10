// components/calculators/DownPaymentVerdict.tsx
//
// The page answers "what deposit gets me this EMI". The question it does
// not answer is the one that actually decides how much to put down: what
// does the next chunk of deposit buy?
//
// So this prices the deposit in both directions — what another lakh saves,
// and what holding a lakh back costs — because the honest answer is that
// cash in hand has its own value and this tool cannot know yours.

"use client";

import { calculateEmi } from "@/lib/emiMath";
import { formatRupee } from "@/lib/calculatorFormat";

const STEP = 100_000;

export default function DownPaymentVerdict({
  exShowroomPrice,
  downPayment,
  loanAmount,
  interestRate,
  tenureYears,
  totalInterest,
}: {
  exShowroomPrice: number;
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  tenureYears: number;
  totalInterest: number;
}) {
  if (loanAmount <= 0 || exShowroomPrice <= 0) return null;

  const pct = (downPayment / exShowroomPrice) * 100;

  const at = (loan: number) => calculateEmi(Math.max(loan, 0), interestRate, tenureYears);
  const more = at(loanAmount - STEP);
  const less = at(loanAmount + STEP);

  const canPayMore = loanAmount > STEP;
  const canPayLess = downPayment > STEP;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-[13.5px] font-bold text-ink">What the deposit buys</h3>

      <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
        Putting down <span className="font-semibold text-ink">{formatRupee(downPayment)}</span> —{" "}
        <span className="font-semibold text-brand">{pct.toFixed(0)}%</span> of the price — leaves{" "}
        <span className="font-semibold text-ink">{formatRupee(loanAmount)}</span> on finance, and{" "}
        <span className="font-semibold text-ink">{formatRupee(totalInterest)}</span> of interest
        over {tenureYears} {tenureYears === 1 ? "year" : "years"}.
      </p>

      <div className="mt-3.5 space-y-2 border-t border-border-soft pt-3">
        {canPayMore && (
          <p className="text-[12.5px] leading-relaxed text-muted">
            <span className="font-semibold text-ink">₹1 lakh more down</span> — EMI{" "}
            {formatRupee(more.emi)}, and{" "}
            <span className="font-semibold text-ink">
              {formatRupee(totalInterest - more.totalInterest)}
            </span>{" "}
            less interest paid.
          </p>
        )}
        {canPayLess && (
          <p className="text-[12.5px] leading-relaxed text-muted">
            <span className="font-semibold text-ink">₹1 lakh less down</span> — EMI{" "}
            {formatRupee(less.emi)}, and{" "}
            <span className="font-semibold text-ink">
              {formatRupee(less.totalInterest - totalInterest)}
            </span>{" "}
            more interest paid.
          </p>
        )}
      </div>

      <p className="mt-3 text-[10.5px] leading-relaxed text-subtle">
        A bigger deposit always costs less interest — that part is arithmetic. Whether it is worth
        it is not: it depends on what else the cash could do and what you want left in reserve,
        neither of which this page knows.
      </p>
    </div>
  );
}

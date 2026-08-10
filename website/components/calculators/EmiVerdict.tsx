// components/calculators/EmiVerdict.tsx
//
// A calculator that only returns a number leaves the reader to work out
// what it means. This states the two things the arithmetic already knows
// but does not say: what the borrowing actually costs on top of the car,
// and what a different tenure would trade for it.
//
// Deliberately not advice. We do not know the reader's income, so nothing
// here says whether they can afford it — only what the numbers are, and
// what changing one input would do.

"use client";

import { calculateEmi } from "@/lib/emiMath";
import { formatRupee } from "@/lib/calculatorFormat";

export default function EmiVerdict({
  loanAmount,
  interestRate,
  tenureYears,
  totalInterest,
  tenureOptions,
}: {
  loanAmount: number;
  interestRate: number;
  tenureYears: number;
  totalInterest: number;
  tenureOptions: number[];
}) {
  if (loanAmount <= 0 || totalInterest <= 0) return null;

  const interestShare = (totalInterest / loanAmount) * 100;

  // The nearest shorter and longer tenures, priced. Both directions matter:
  // one shows what the lower EMI is costing, the other what buying it back
  // would take.
  const shorter = [...tenureOptions].filter((y) => y < tenureYears).pop();
  const longer = tenureOptions.find((y) => y > tenureYears);

  const priced = (years: number) => {
    const { emi, totalInterest: interest } = calculateEmi(loanAmount, interestRate, years);
    return { years, emi, interest, delta: interest - totalInterest };
  };

  const alternatives = [shorter, longer].filter((y): y is number => y !== undefined).map(priced);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-[13.5px] font-bold text-ink">What this actually costs</h3>

      <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
        Over {tenureYears} {tenureYears === 1 ? "year" : "years"} you repay{" "}
        <span className="font-semibold text-ink">{formatRupee(totalInterest)}</span> in interest on{" "}
        <span className="font-semibold text-ink">{formatRupee(loanAmount)}</span> borrowed — the
        loan adds <span className="font-semibold text-brand">{interestShare.toFixed(1)}%</span> to
        the price of the car.
      </p>

      {alternatives.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-border-soft pt-3">
          {alternatives.map((a) => (
            <p key={a.years} className="text-[12.5px] leading-relaxed text-muted">
              <span className="font-semibold text-ink">
                {a.years} {a.years === 1 ? "year" : "years"}
              </span>{" "}
              — {formatRupee(a.emi)}/month,{" "}
              {a.delta < 0 ? (
                <>
                  saving <span className="font-semibold text-ink">{formatRupee(-a.delta)}</span> in
                  interest
                </>
              ) : (
                <>
                  costing <span className="font-semibold text-ink">{formatRupee(a.delta)}</span>{" "}
                  more in interest
                </>
              )}
            </p>
          ))}
        </div>
      )}

      <p className="mt-3 text-[10.5px] leading-relaxed text-subtle">
        Figures assume the rate stays fixed for the full term and exclude processing fees, which
        your lender adds separately.
      </p>
    </div>
  );
}

import SectionHeader from "@/components/common/SectionHeader";

const STEPS = [
  {
    label: "1",
    title: "Max Loan Amount",
    desc: "The reverse of the EMI formula — given your monthly EMI, interest rate and tenure, we solve for the largest loan those payments could cover.",
  },
  {
    label: "2",
    title: "Max Car Price",
    desc: "Max Loan Amount + your Down Payment — the ex-showroom price you could afford with those two put together.",
  },
];

// Same pattern as components/calculators/MileageFormulaExplainer.tsx —
// only the one real formula this calculator uses, no invented on-road
// price / RTO / insurance figures (we don't have real state-wise tax
// data, same reason the site doesn't have an On-Road Price Calculator).
export default function CarAffordabilityFormulaExplainer() {
  return (
    <div className="mt-10">
      <SectionHeader
        eyebrow="How It Works"
        title="How Is Your Budget Calculated?"
        subtitle="We work backwards from your monthly EMI to find the loan — and car price — it can support."
      />

      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col items-center gap-2 rounded-xl bg-page px-6 py-6 text-center sm:py-8">
          <p className="text-[11px] font-bold uppercase tracking-wide text-faint">The Formula</p>
          <p className="font-head text-[18px] font-extrabold text-ink sm:text-[22px]">
            Max Loan = EMI × [(1+r)ⁿ − 1] ÷ [r × (1+r)ⁿ]
          </p>
          <p className="text-[12px] font-medium text-muted">where r = monthly interest rate, n = tenure in months</p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {STEPS.map((step) => (
            <div key={step.label} className="rounded-xl border border-border-soft p-4">
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-[14px] font-extrabold text-brand">
                {step.label}
              </span>
              <p className="mt-3 text-[13.5px] font-bold text-ink">{step.title}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{step.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[12.5px] leading-relaxed text-muted">
          The price shown is the ex-showroom price only. RTO registration, road tax, and insurance vary by state and
          city and aren&apos;t factored in, since we don&apos;t have a reliable, real figure for them to calculate
          from.
        </p>
      </div>
    </div>
  );
}

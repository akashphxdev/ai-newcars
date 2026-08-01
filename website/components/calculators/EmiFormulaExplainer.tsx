import SectionHeader from "@/components/common/SectionHeader";

const STEPS = [
  {
    label: "P",
    title: "Principal (Loan Amount)",
    desc: "Ex-showroom price minus your down payment — the amount you're actually borrowing from the lender.",
  },
  {
    label: "R",
    title: "Monthly Interest Rate",
    desc: "Your annual interest rate divided by 12 months, then by 100 to convert it to a decimal.",
  },
  {
    label: "N",
    title: "Number of Months",
    desc: "Your loan tenure in years multiplied by 12 — e.g. a 5-year loan is 60 monthly installments.",
  },
];

// Static, hand-written explainer — no CMS content for this yet. Kept as
// its own component (not inlined in the page) so it can be reused if a
// second calculator (on-road price, fuel cost) ever needs the same
// "how this is calculated" treatment.
export default function EmiFormulaExplainer() {
  return (
    <div className="mt-10">
      <SectionHeader
        eyebrow="How It Works"
        title="How Is Car Loan EMI Calculated?"
        subtitle="Your EMI is calculated using the standard reducing-balance formula used by every bank and NBFC in India."
      />

      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col items-center gap-2 rounded-xl bg-page px-6 py-6 text-center sm:py-8">
          <p className="text-[11px] font-bold uppercase tracking-wide text-faint">The EMI Formula</p>
          <p className="font-head text-[22px] font-extrabold text-ink sm:text-[26px]">
            EMI = P × R × (1 + R)<sup>N</sup> ÷ [(1 + R)<sup>N</sup> − 1]
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          This is the same reducing-balance method every bank and NBFC in India uses — as you pay each EMI, a larger
          share goes toward the principal and a smaller share toward interest over time (see the Amortization
          Schedule above for the exact year-wise breakup on your loan).
        </p>
      </div>
    </div>
  );
}

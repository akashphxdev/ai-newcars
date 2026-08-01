import SectionHeader from "@/components/common/SectionHeader";
import { ChevronDownIcon } from "@/components/common/icons";

const FAQS = [
  {
    q: "How is car loan EMI calculated?",
    a: "EMI is calculated using the reducing-balance formula: EMI = P × R × (1+R)^N ÷ [(1+R)^N − 1], where P is your loan amount (principal), R is the monthly interest rate, and N is the loan tenure in months. See the \"How Is Car Loan EMI Calculated?\" section above for a full breakdown.",
  },
  {
    q: "What is a good down payment for a car loan?",
    a: "Most lenders expect 10-20% of the car's ex-showroom price as a down payment. A higher down payment lowers your loan amount, which reduces both your EMI and the total interest you pay over the loan tenure.",
  },
  {
    q: "Does a longer loan tenure mean lower EMI?",
    a: "Yes — spreading the same loan amount over more months lowers each monthly installment. But a longer tenure also means you pay more total interest over the life of the loan, so it's a trade-off between monthly affordability and overall cost.",
  },
  {
    q: "What interest rate should I use in the calculator?",
    a: "Car loan interest rates in India typically range from 8% to 12% p.a., depending on the lender, your credit score, and the loan tenure. Use the rate quoted by your bank/NBFC for the most accurate estimate, or the default 9% as a reasonable starting point.",
  },
  {
    q: "Is the EMI shown here exact, or just an estimate?",
    a: "It's an estimate for planning purposes. Your actual EMI depends on the exact interest rate, processing fees, and terms your lender offers — always confirm the final figure with your bank or NBFC before signing a loan agreement.",
  },
  {
    q: "Can I change the interest rate and tenure after selecting a car?",
    a: "Yes — once you pick a brand, model and variant, you can freely adjust the down payment, interest rate and tenure, and the EMI, loan summary and breakdown all update instantly.",
  },
];

// Same pattern as components/compare/CompareFaq.tsx — static hand-written
// content + FAQPage JSON-LD, native <details>/<summary> (accessible,
// no JS needed for the accordion itself).
export default function EmiCalculatorFaq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="mt-10">
      <SectionHeader
        eyebrow="FAQs"
        title="Frequently Asked Questions"
        subtitle="Common questions about car loan EMIs and how this calculator works."
      />

      <div className="flex flex-col gap-3">
        {FAQS.map((f, i) => (
          <details
            key={f.q}
            open={i === 0}
            className="group rounded-2xl border border-border bg-surface p-4 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-ink">
              {f.q}
              <ChevronDownIcon className="size-4 shrink-0 text-brand transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}

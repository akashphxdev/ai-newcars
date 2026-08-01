import SectionHeader from "@/components/common/SectionHeader";
import { ChevronDownIcon } from "@/components/common/icons";

const FAQS = [
  {
    q: "How is my max car price calculated?",
    a: "We take the monthly EMI you can pay and reverse the EMI formula to find the largest loan amount those payments could cover, at your chosen interest rate and tenure. Your down payment is then added on top to get the max car price.",
  },
  {
    q: "Does the price shown include RTO, road tax, or insurance?",
    a: "No — it's the ex-showroom price only. On-road charges like RTO registration, road tax and insurance vary by state and city, and we don't have reliable real data for them, so we don't show a made-up number.",
  },
  {
    q: "Does this guarantee I'll get approved for this loan amount?",
    a: "No — this is an estimate based on the figures you enter. Actual loan eligibility depends on your income, credit score, and the lender's own criteria, and may differ from what's shown here.",
  },
  {
    q: "What interest rate should I use?",
    a: "Car loan interest rates in India typically range from 8% to 12% per annum depending on the lender and your credit profile — check with your bank or dealer for the exact rate you'd qualify for.",
  },
  {
    q: "Can I filter the cars shown by body type?",
    a: "Yes — use the Body Type dropdown above each car list to narrow results to SUVs, sedans, hatchbacks, and more. Click \"View All\" to see every matching car on a full listing page.",
  },
  {
    q: "Why is the Electric Cars section separate?",
    a: "It shows only electric cars that fit the same budget, so you can compare EV options within your affordability without them mixing in with petrol/diesel/CNG results.",
  },
];

// Same pattern as components/calculators/MileageCalculatorFaq.tsx.
export default function CarAffordabilityFaq() {
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
        subtitle="Common questions about your budget, loan estimate, and how this calculator works."
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

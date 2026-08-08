import SectionHeader from "@/components/common/SectionHeader";
import { ChevronDownIcon } from "@/components/common/icons";

const FAQS = [
  {
    q: "What is a good down payment for a car?",
    a: "A 20% down payment is a useful starting point, but the right amount depends on the EMI you can sustain. Paying more upfront reduces both the loan principal and the total interest you pay.",
  },
  {
    q: "What costs are due upfront?",
    a: "The calculator shows the down payment against the ex-showroom price. Registration, road tax, insurance, accessories, and lender fees may also be due at purchase and vary by city and dealer.",
  },
  {
    q: "How does down payment affect EMI?",
    a: "A larger down payment means a smaller loan. At the same interest rate and tenure, that directly lowers the monthly EMI and total payable interest.",
  },
  {
    q: "Can I finance the entire car price?",
    a: "Some lenders offer high loan-to-value financing, but eligibility depends on your credit profile, income, car, and lender policy. Treat this calculator as a planning estimate and confirm the final terms with the lender.",
  },
];

export default function DownPaymentCalculatorFaq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section className="mt-16 border-t border-border pt-10 sm:pt-12 lg:grid lg:grid-cols-[minmax(240px,0.45fr)_minmax(0,1fr)] lg:gap-12">
      <SectionHeader
        eyebrow="Plan with context"
        title="Understand the upfront cost"
        subtitle="The key questions to settle before choosing your loan amount."
      />

      <div className="border-t border-border">
        {FAQS.map((item, index) => (
          <details
            key={item.q}
            open={index === 0}
            className="group border-b border-border bg-transparent py-4 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-ink">
              {item.q}
              <ChevronDownIcon className="size-4 shrink-0 text-brand transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}

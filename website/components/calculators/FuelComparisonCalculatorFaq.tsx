import SectionHeader from "@/components/common/SectionHeader";
import { ChevronDownIcon } from "@/components/common/icons";

const FAQS = [
  {
    q: "How is the running cost for each fuel type calculated?",
    a: "Cost per km = Fuel Price ÷ Mileage, for each fuel type. Monthly cost is then cost-per-km × your monthly driving distance — the same formula, applied separately to each fuel type's own mileage and price.",
  },
  {
    q: "Where does the mileage figure for each fuel type come from?",
    a: "It's pre-filled from that fuel type's cheapest variant on the selected model, using its own real-world rated mileage (or range, for EV) from the spec sheet. You can edit it if your actual mileage differs.",
  },
  {
    q: "Why don't I see all four fuel types for every car?",
    a: "Only the fuel types a model is actually sold in are shown — we don't invent a Diesel or CNG option for a car that was never made in that fuel type. Most models offer only one or two fuel types.",
  },
  {
    q: "Why do I have to enter the fuel price myself?",
    a: "We prefill current petrol, diesel, and CNG rates when they are available for your selected city. You can edit any local rate, and should enter your own electricity tariff for an accurate EV comparison.",
  },
  {
    q: "Does this account for the price difference between fuel-type variants?",
    a: "No — this compares only running cost (fuel/energy cost per km and per month), not the on-road purchase price difference between variants. A cheaper-to-run fuel type may still have a higher upfront price.",
  },
  {
    q: "Does this include maintenance or insurance differences between fuel types?",
    a: "No — those genuinely differ between petrol, diesel, CNG and EV variants, but we don't have reliable data to calculate them from, so we don't show a made-up number for them.",
  },
];

// Same pattern as components/calculators/MileageCalculatorFaq.tsx.
export default function FuelComparisonCalculatorFaq() {
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
    <section className="mt-16 border-t border-border pt-10 sm:pt-12 lg:grid lg:grid-cols-[minmax(240px,0.45fr)_minmax(0,1fr)] lg:gap-12">
      <SectionHeader
        eyebrow="FAQs"
        title="Frequently Asked Questions"
        subtitle="Common questions about comparing fuel types and how this calculator works."
      />

      <div className="border-t border-border">
        {FAQS.map((f, i) => (
          <details
            key={f.q}
            open={i === 0}
            className="group border-b border-border bg-transparent py-4 [&_summary::-webkit-details-marker]:hidden"
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
    </section>
  );
}

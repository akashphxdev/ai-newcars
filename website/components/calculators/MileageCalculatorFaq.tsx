import SectionHeader from "@/components/common/SectionHeader";
import { ChevronDownIcon } from "@/components/common/icons";

const FAQS = [
  {
    q: "How is the running cost calculated?",
    a: "Cost per km = Fuel Price ÷ Mileage. Daily cost is cost-per-km × (monthly distance ÷ 30), monthly cost is cost-per-km × your monthly distance, and yearly cost is monthly cost × 12. See the \"How Is Mileage & Running Cost Calculated?\" section above for the full breakdown.",
  },
  {
    q: "Where does the mileage figure come from?",
    a: "It's pre-filled from the selected variant's own real-world rated mileage (or range, for EVs) as listed on its spec sheet. You can edit it if your actual observed mileage is different.",
  },
  {
    q: "Why isn't there a fuel price already filled in?",
    a: "Fuel and electricity prices change often and vary by state and city, and we don't have a live fuel-price feed. Enter today's price from your local pump (or your electricity tariff for EVs) for an accurate result.",
  },
  {
    q: "Does this include maintenance, insurance, or the effect of traffic and AC usage?",
    a: "No — those genuinely affect your real running cost, but we don't have reliable data to calculate them from, so we don't show a made-up number for them. What's shown here is purely fuel/energy cost based on the mileage and price you provide.",
  },
  {
    q: "Can I calculate mileage for CNG or electric cars too?",
    a: "Yes — use the Fuel Type selector to switch between Petrol, Diesel, CNG and EV. The variant list, price unit (per litre/kg/kWh) and mileage unit (kmpl or km/kWh) all update to match.",
  },
  {
    q: "How accurate is the mileage shown for my car?",
    a: "It's the manufacturer's rated figure for that variant, not a guarantee. Actual mileage depends on driving style, traffic, vehicle condition and maintenance — see the \"Mileage Affected By\" section above.",
  },
];

// Same pattern as components/calculators/EmiCalculatorFaq.tsx.
export default function MileageCalculatorFaq() {
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
        subtitle="Common questions about mileage, running cost, and how this calculator works."
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

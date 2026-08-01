import SectionHeader from "@/components/common/SectionHeader";
import { ChevronDownIcon } from "@/components/common/icons";

const FAQS = [
  {
    q: "How is the charging time calculated?",
    a: "Time = Battery Capacity × (Charge To % − Charge From %) ÷ 100 ÷ Charger Output. For example, a 50 kWh battery charging from 20% to 80% on a 50 kW charger needs (50 × 60 ÷ 100) ÷ 50 = 0.6 hours.",
  },
  {
    q: "Where do the battery capacity and charging output figures come from?",
    a: "They're pulled straight from the selected variant's own spec sheet — battery capacity in kWh, and the AC/DC charging output in kW, exactly as the manufacturer lists them.",
  },
  {
    q: "Why might my actual charging time be longer than shown?",
    a: "This estimate assumes a constant charging rate across the whole range. In reality, most EVs charge fast up to around 80% and then taper off to protect the battery, so the last 20% usually takes noticeably longer than this straight-line estimate suggests.",
  },
  {
    q: "What's the difference between AC and DC fast charging?",
    a: "AC charging (home/wallbox) uses the car's onboard charger and is slower but gentler on the battery. DC fast charging bypasses the onboard charger for much higher power and is meant for quick top-ups on the road, not daily use.",
  },
  {
    q: "Does temperature or battery health affect charging time?",
    a: "Yes — cold weather and battery degradation can both slow down charging in practice. This calculator doesn't factor those in since they vary too much car to car to give a reliable number.",
  },
  {
    q: "Can I use this for any EV on the site?",
    a: "Yes — pick any brand, model and electric variant. Models without an electric variant won't appear in the variant list.",
  },
];

// Same pattern as components/calculators/MileageCalculatorFaq.tsx.
export default function EvChargingCalculatorFaq() {
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
        subtitle="Common questions about EV charging time and how this calculator works."
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

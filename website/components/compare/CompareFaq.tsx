import SectionHeader from "@/components/common/SectionHeader";
import { ChevronDownIcon } from "@/components/common/icons";

const FAQS = [
  {
    q: "How do I compare two or more cars on TimesAuto?",
    a: "Use the \"Select Cars to Compare\" tool above — pick a brand and model for each slot (2 to 4 cars), then hit Compare. You'll get a side-by-side breakdown of price, specs, and features.",
  },
  {
    q: "What should I check before buying a car?",
    a: "Focus on what actually affects daily use and running cost: on-road price, mileage, engine power and torque, boot space, safety rating (NCAP), and after-sales service network in your city.",
  },
  {
    q: "Which is more important — mileage or power?",
    a: "It depends on how you drive. For mostly city commuting, mileage and low-end torque matter more. For highway driving or a sportier feel, power and top speed matter more. Compare both cars' specs side-by-side to decide.",
  },
  {
    q: "Can I compare petrol, diesel, CNG, and electric cars together?",
    a: "Yes — the comparison tool works across fuel types. Just keep in mind running-cost and range figures aren't directly comparable across fuel types, so check those numbers individually for each car.",
  },
  {
    q: "Does comparing cars here cost anything?",
    a: "No, comparing cars on TimesAuto is completely free.",
  },
];

// No CMS-backed FAQ system exists yet — this is static, hand-written
// content plus FAQPage JSON-LD so it's eligible for Google's FAQ rich
// snippets. Native <details>/<summary> keeps it accessible and JS-free.
// Colors use the site's semantic tokens (bg-surface/text-ink/...), so
// this follows the same light/dark theming as every other section —
// no page-specific dark styling.
export default function CompareFaq() {
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
        subtitle="Find answers to common questions about comparing cars on TimesAuto."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-[26px] font-extrabold text-brand">
            ?
          </span>
          <p className="text-[15px] font-bold text-ink">Still have questions?</p>
          <p className="text-[13px] text-muted">Our team is here to help you find the perfect car.</p>
          <a
            href="#"
            className="mt-1 rounded-xl border-[1.5px] border-brand px-4 py-2 text-[12.5px] font-bold text-brand transition-colors hover:bg-orange-50"
          >
            Contact Support
          </a>
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map((f, i) => (
            <details
              key={f.q}
              open={i === 0}
              className="group rounded-2xl border border-border bg-surface p-4 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15.5px] font-semibold text-ink">
                {f.q}
                <ChevronDownIcon className="size-4 shrink-0 text-brand transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}

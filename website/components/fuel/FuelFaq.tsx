// components/fuel/FuelFaq.tsx
//
// The questions people actually search alongside "petrol price in <city>".
// Written per scope so a city page answers about that city by name rather
// than repeating one generic block across 800 URLs, which reads as
// boilerplate to a crawler and to a reader.

import JsonLd from "@/components/common/JsonLd";
import { ChevronDownIcon } from "@/components/common/icons";
import { faqJsonLd } from "@/lib/seo";

export interface FuelFaqScope {
  /** "Pune", "Maharashtra", or "India". */
  place: string;
  /** The state a city sits in. Omitted for state and national pages. */
  state?: string;
  petrol?: string;
  diesel?: string;
  cng?: string;
}

const rupees = (value?: string) => {
  const n = Number(value);
  return Number.isFinite(n) ? `₹${n.toFixed(2)}` : null;
};

function buildFaqs(scope: FuelFaqScope): { q: string; a: string }[] {
  const { place, state } = scope;
  const petrol = rupees(scope.petrol);
  const diesel = rupees(scope.diesel);
  const cng = rupees(scope.cng);
  const where = state ? `${place}, ${state}` : place;

  const faqs: { q: string; a: string }[] = [];

  if (petrol || diesel) {
    const parts = [
      petrol && `petrol costs ${petrol} per litre`,
      diesel && `diesel costs ${diesel} per litre`,
      cng && `CNG costs ${cng} per kg`,
    ].filter(Boolean);
    faqs.push({
      q: `What is the fuel price in ${place} today?`,
      a: `In ${where}, ${parts.join(", ")}. These are today's retail pump rates, revised by the oil marketing companies at 6:00 AM and updated here daily.`,
    });
  }

  faqs.push(
    {
      q: `Why do petrol and diesel prices change every day?`,
      a: "Since June 2017 Indian fuel prices have moved under daily dynamic pricing. Oil marketing companies reset rates each morning against the previous fortnight's average international crude and product prices and the rupee-dollar exchange rate, so a change is passed on the next day rather than held back for weeks.",
    },
    {
      q: `Why is fuel cheaper in some cities than in ${place}?`,
      a: "The base price is broadly the same nationwide; what differs is tax. State VAT (and in some states an additional cess) is levied as a percentage, so the same litre costs more in a high-VAT state. Distance from the supplying refinery or depot adds freight, which is why prices vary between cities inside one state too.",
    },
    {
      q: `What makes up the price of a litre of petrol?`,
      a: "Roughly: the base price of the fuel itself, plus freight, then the central excise duty, the dealer's commission, and finally state VAT charged on top of all of the above. Because VAT is applied last and as a percentage, a rise in crude raises the tax collected as well as the base price.",
    },
    {
      q: `At what time are fuel prices updated in ${place}?`,
      a: "New rates take effect at 6:00 AM every day, including weekends and holidays. This page is refreshed daily from public oil-marketing updates and local dealer reports, so the figures shown are the current day's rates.",
    },
    {
      q: `Is CNG cheaper to run than petrol?`,
      a: "Usually yes. CNG is priced per kilogram rather than per litre and a CNG vehicle typically travels further on a kilogram than a petrol car does on a litre, so the cost per kilometre is normally lower — though a factory CNG variant costs more to buy and gives up some boot space.",
    },
  );

  return faqs;
}

export default function FuelFaq({ scope }: { scope: FuelFaqScope }) {
  const faqs = buildFaqs(scope);

  return (
    <section className="border-t border-border-soft bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:py-16 lg:grid-cols-[minmax(260px,0.34fr)_minmax(0,0.66fr)]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-brand">FAQs</p>
          <h2 className="mt-2 text-balance font-head text-[28px] font-extrabold leading-tight text-ink sm:text-[36px]">
            Fuel prices in {scope.place}, explained
          </h2>
          <p className="mt-3 max-w-sm text-[13.5px] leading-6 text-muted">
            Short answers for daily price changes, city differences, CNG economics and update timing.
          </p>
        </div>

        <div className="grid gap-3">
          {faqs.map((faq, index) => (
            <details
              key={faq.q}
              open={index === 0}
              className="group h-fit rounded-[8px] border border-border bg-page p-4 transition hover:border-faint [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-bold text-ink">
                <span className="max-w-[62ch]">{faq.q}</span>
                <ChevronDownIcon className="size-4 shrink-0 text-brand transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 max-w-[78ch] text-[13px] leading-6 text-muted">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      <JsonLd data={faqJsonLd(faqs)} />
    </section>
  );
}

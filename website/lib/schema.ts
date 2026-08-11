// lib/schema.ts
//
// JSON.stringify never escapes "<", so a value containing the literal
// text "</script>" (an FAQ answer, an entity name, admin-typed schema
// JSON, ...) would close a <script type="application/ld+json"> tag early
// and let whatever follows run as real markup/script — a JSON-LD
// script-injection XSS. < is a valid JSON escape for "<", so this is
// lossless for any JSON consumer (Google's parser, JSON.parse, ...) while
// guaranteeing the raw HTML never contains a literal "<" for the browser
// to match "</script>" against. Every place that renders JSON-LD via
// dangerouslySetInnerHTML should stringify through this, not JSON.stringify
// directly.
export function toSafeJsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

// FAQPage JSON-LD builder for pages whose FAQ content is real, existing
// data already rendered on the page (e.g. a car model's admin-entered
// FAQs) — generating it from that same data means it can never drift out
// of sync with what's actually shown, and there's nothing for an editor
// to hand-type or get wrong.
export function buildFaqPageSchema(faqs: { question: string; answer: string }[]): string | null {
  if (faqs.length === 0) return null;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  });
}

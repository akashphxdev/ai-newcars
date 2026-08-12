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

// BreadcrumbList tells Google the path to a page, which is what turns the
// green URL line in a result into "TimesAuto › Tata › Nexon". The site
// renders a breadcrumb on every model and variant page and described it
// to nobody.
export function buildBreadcrumbSchema(trail: { name: string; url: string }[]): string | null {
  if (trail.length < 2) return null;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  });
}

// Organization and WebSite for the home page. The SearchAction is what
// makes Google offer a search box under the brand result, and it can only
// do that if a site declares where its search lives.
export function buildSiteSchema(siteUrl: string, name: string): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name,
        url: siteUrl,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name,
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/new-cars?search={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  });
}

// lib/seo.ts
//
// Structured-data builders. Kept here rather than inline in pages so the
// same breadcrumb trail feeds both the visible <nav> and the JSON-LD, and
// the two can never drift apart.

import { absoluteUrl } from "@/lib/routes";

export interface Crumb {
  name: string;
  /** Site-relative path. Omit on the final crumb — the current page. */
  href?: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(crumb.href ? { item: absoluteUrl(crumb.href) } : {}),
    })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

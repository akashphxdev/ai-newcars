// src/lib/lookups.ts
export interface LookupOption {
  value: number;
  label: string;
}

export interface StringLookupOption {
  value: string;
  label: string;
}

export const OFFER_TYPE_OPTIONS: LookupOption[] = [
  { value: 1, label: "Cash discount" },
  { value: 2, label: "Exchange bonus" },
  { value: 3, label: "Corporate discount" },
  { value: 4, label: "Loyalty bonus" },
  { value: 5, label: "Finance offer" },
  { value: 6, label: "Other" },
];

export function getOfferTypeLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return OFFER_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}

// ===== Fuel types =====
// Mirrors FUEL_TYPE_CODES in backend/src/modules/newCars/powertrainIce/powertrainIce.validation.ts —
// keep both in sync if a code is ever added/removed.
export const FUEL_TYPE_OPTIONS: LookupOption[] = [
  { value: 1, label: "Petrol" },
  { value: 2, label: "Diesel" },
  { value: 3, label: "CNG" },
  { value: 4, label: "LPG" },
  { value: 5, label: "Hybrid" },
];

export function getFuelTypeLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return FUEL_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}

// ===== Ad placement page types =====
// Mirrors PAGE_TYPE_CODES in backend/src/modules/ads/adPlacement/adPlacement.validation.ts —
// keep both in sync if a code is ever added/removed.
export const PAGE_TYPE_OPTIONS: LookupOption[] = [
  { value: 1, label: "Home" },
  { value: 2, label: "Car" },
  { value: 3, label: "Article" },
];

export function getPageTypeLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return PAGE_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}

// ===== Ad placement ad types =====
// Mirrors AD_TYPE_CODES in backend/src/modules/ads/adPlacement/adPlacement.validation.ts —
// keep both in sync if a code is ever added/removed.
export const AD_TYPE_OPTIONS: LookupOption[] = [
  { value: 1, label: "Header" },
  { value: 2, label: "Middle" },
  { value: 3, label: "Footer" },
  { value: 4, label: "Slider" },
];

export function getAdTypeLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return AD_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}

// ===== Banner media types =====
// Mirrors BANNER_MEDIA_TYPE_CODES in backend/src/modules/home/banner/banner.validation.ts —
// keep both in sync if a code is ever added/removed.
export const BANNER_MEDIA_TYPE_OPTIONS: LookupOption[] = [
  { value: 1, label: "Image" },
  { value: 2, label: "Video" },
];

export function getBannerMediaTypeLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return BANNER_MEDIA_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}

// ===== SEO page types =====
// Mirrors SEO_PAGE_TYPE_CODES in backend/src/modules/seo/seoMeta/seoMeta.validation.ts —
// keep both in sync if a code is ever added/removed. Not the same meaning
// as ad placement's PAGE_TYPE_OPTIONS above, despite sharing 1/2/3.
export const SEO_PAGE_TYPE = {
  BRAND: 1,
  MODEL: 2,
  DETAIL: 3,
  STATIC: 4,
  NEWS_CATEGORY: 5,
  BODY_TYPE: 6,
} as const;

export const SEO_PAGE_TYPE_OPTIONS: LookupOption[] = [
  { value: SEO_PAGE_TYPE.BRAND, label: "Brand Listing" },
  { value: SEO_PAGE_TYPE.MODEL, label: "Model Detail" },
  { value: SEO_PAGE_TYPE.DETAIL, label: "Variant Detail" },
  { value: SEO_PAGE_TYPE.BODY_TYPE, label: "Body Type Listing" },
  { value: SEO_PAGE_TYPE.NEWS_CATEGORY, label: "News Category" },
  { value: SEO_PAGE_TYPE.STATIC, label: "Static page" },
];

// Same codes, minus Static — used by the dynamic (Brand/Model/Variant/
// BodyType/News Category) SEO panel, which has its own entity-search flow
// per type and has no business offering "Static page" (that's the
// fixed-slug picker's job).
export const DYNAMIC_SEO_PAGE_TYPE_OPTIONS: LookupOption[] = SEO_PAGE_TYPE_OPTIONS.filter(
  (o) => o.value !== SEO_PAGE_TYPE.STATIC,
);

export function getSeoPageTypeLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return SEO_PAGE_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}

// ===== Static page slugs (pageType = SEO_PAGE_TYPE.STATIC) =====
// Fixed list of the site's actual static pages (website/app/**/page.tsx),
// so the admin picks a slug from a dropdown instead of free-typing it
// (which risked typos like "home" vs "Home" vs "homepage" never matching
// what the website actually requests). "compare-detail" is the one
// exception with no direct route — it's the default SEO template used
// for every /compare/[comparisonSlug] page, since each individual
// comparison can't realistically get its own row.
export const STATIC_PAGE_SLUG_OPTIONS: StringLookupOption[] = [
  { value: "home", label: "Home" },
  { value: "brands", label: "Brands Listing" },
  { value: "new-cars", label: "New Cars Listing" },
  { value: "electric-cars", label: "Electric Cars" },
  { value: "upcoming-cars", label: "Upcoming Cars" },
  { value: "compare-cars", label: "Compare Tool" },
  { value: "compare-detail", label: "Compare Detail (default template)" },
  { value: "stories", label: "Stories" },
  // No "maintenance" entry — that page is always noindex/nofollow and
  // shows fixed copy (see website/app/maintenance/page.tsx's static
  // metadata export), so there's nothing for an admin to usefully manage.
  { value: "car-affordability-calculator", label: "Car Affordability Calculator" },
  { value: "car-loan-emi-calculator", label: "Car Loan EMI Calculator" },
  { value: "down-payment-calculator", label: "Down Payment Calculator" },
  { value: "ev-charging-time-calculator", label: "EV Charging Time Calculator" },
  { value: "fuel-comparison-calculator", label: "Fuel Comparison Calculator" },
  { value: "mileage-calculator", label: "Mileage Calculator" },
];

// Placeholder tokens available per dynamic pageType (Brand/Model/Variant/
// BodyType/News Category) — same substitution mechanism as
// STATIC_PAGE_PLACEHOLDER_TOKENS below (see website/features/seo/seo.api.ts's
// getEntityPageMetadata), but these matter most on the "default template"
// row (no specific entity picked) since that one row's text applies to
// every entity of that type — e.g. every car model, not just one.
export const DYNAMIC_PAGE_TYPE_PLACEHOLDER_TOKENS: Record<number, string[]> = {
  [SEO_PAGE_TYPE.BRAND]: ["{{brand_name}}", "{{brand_slug}}"],
  [SEO_PAGE_TYPE.MODEL]: ["{{brand_name}}", "{{brand_slug}}", "{{model_name}}", "{{model_slug}}"],
  [SEO_PAGE_TYPE.DETAIL]: [
    "{{brand_name}}",
    "{{brand_slug}}",
    "{{model_name}}",
    "{{model_slug}}",
    "{{variant_name}}",
    "{{variant_slug}}",
  ],
  [SEO_PAGE_TYPE.BODY_TYPE]: ["{{bodytype_name}}", "{{bodytype_slug}}"],
  [SEO_PAGE_TYPE.NEWS_CATEGORY]: ["{{category_name}}", "{{category_slug}}"],
};

// Placeholder tokens available for specific static pages — the website
// substitutes these with the real values at render time (see
// website/features/seo/seo.api.ts's fillComparePlaceholders), since a page
// like "compare-detail" is one shared template applied to every
// /compare/[slug] pair, not one row per pair. Only add a slug here once
// the website actually knows how to fill its tokens in.
//
// A comparison can have 2-4 cars (see MAX_CARS on the website's compare
// page) — car3/car4 tokens are only filled in when that many cars are
// actually being compared; the website strips them automatically
// otherwise, so it's safe to use them even in text meant for a 2-car pair.
export const STATIC_PAGE_PLACEHOLDER_TOKENS: Record<string, string[]> = {
  "compare-detail": [
    "{{car1_name}}",
    "{{car2_name}}",
    "{{car3_name}}",
    "{{car4_name}}",
    "{{car1_slug}}",
    "{{car2_slug}}",
    "{{car3_slug}}",
    "{{car4_slug}}",
  ],
};

// ===== SEO Manager — Structured Data tab (shared by SeoMetaModal.tsx and
// DynamicSeoMetaModal.tsx) =====
export const ROBOTS_PRESETS = ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"];

// One entry per JSON-LD schema.org type either SEO form can author. Keys
// must match the SeoMeta columns 1:1 (vehicleSchema, reviewSchema, ...).
// No FAQ entry — FAQ content only exists for CarModel (Model Detail) and
// a handful of static pages with a fixed, hand-written FAQ list in code
// (EmiCalculatorFaq.tsx, CompareFaq.tsx, ...), both of which already
// generate their own FAQPage JSON-LD straight from that real content; no
// other page/entity has FAQ content to match a schema against.
export const SCHEMA_FIELDS = [
  { key: "vehicleSchema", label: "Vehicle / Product schema", hint: "Specs, price & rating — schema.org/Car or /Product." },
  { key: "reviewSchema", label: "Review schema", hint: "schema.org/Review or AggregateRating." },
  { key: "articleSchema", label: "Article schema", hint: "schema.org/Article — for blog/news pages." },
  { key: "authorSchema", label: "Author schema", hint: "schema.org/Person — content author profile." },
  { key: "breadcrumbSchema", label: "Breadcrumb schema", hint: "schema.org/BreadcrumbList — navigation path." },
] as const;

export type SchemaFieldKey = (typeof SCHEMA_FIELDS)[number]["key"];
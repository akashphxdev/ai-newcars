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
  { value: "maintenance", label: "Maintenance" },
  { value: "car-affordability-calculator", label: "Car Affordability Calculator" },
  { value: "car-loan-emi-calculator", label: "Car Loan EMI Calculator" },
  { value: "down-payment-calculator", label: "Down Payment Calculator" },
  { value: "ev-charging-time-calculator", label: "EV Charging Time Calculator" },
  { value: "fuel-comparison-calculator", label: "Fuel Comparison Calculator" },
  { value: "mileage-calculator", label: "Mileage Calculator" },
];
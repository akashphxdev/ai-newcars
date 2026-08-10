// lib/routes.ts
//
// Every internal URL is built here. Before this existed, 13 files
// hand-rolled template literals like `/${brand.slug}-cars`, so changing a
// path meant finding and editing all of them. Adding a route below is now
// the only edit a URL change needs.
//
// The public paths and the app/ folder structure deliberately differ: the
// brand paths are keyword-rich ("tata cars" is a real search query), which
// a Next.js folder cannot express — a dynamic segment must be a whole path
// segment, so `[brandSlug]-cars` is not a legal folder name. One catch-all
// rewrite in next.config.ts maps `/:brand-cars/:path*` onto
// `/brand/:brand/:path*`. That is the only rewrite in the app.

export const routes = {
  home: () => "/",

  // ---- Brands -------------------------------------------------------
  // /tata-cars
  brand: (brandSlug: string) => `/${brandSlug}-cars`,
  allBrands: () => "/brands",

  // ---- Models -------------------------------------------------------
  // /tata-cars/nexon
  model: (brandSlug: string, modelSlug: string) => `/${brandSlug}-cars/${modelSlug}`,
  modelPhotos: (brandSlug: string, modelSlug: string) =>
    `/${brandSlug}-cars/${modelSlug}/photos`,

  // Variants sit behind a literal `variant` segment. Previously the
  // variant slug was a bare third segment, which swallowed every other
  // word — /photos only worked because it was registered first, and
  // /review or /on-road-price would have been read as variant lookups.
  variant: (brandSlug: string, modelSlug: string, variantSlug: string) =>
    `/${brandSlug}-cars/${modelSlug}/variant/${variantSlug}`,

  // ---- Listings -----------------------------------------------------
  newCars: () => "/new-cars",
  // Body types are filtered new-car listings, so they live under
  // /new-cars rather than sharing the /*-cars namespace with brands.
  bodyType: (slug: string) => `/new-cars/${slug}`,
  electricCars: () => "/electric-cars",
  upcomingCars: () => "/upcoming-cars",
  usedCarsInCity: (citySlug: string) => `/used-cars/${citySlug}`,

  // ---- Fuel ---------------------------------------------------------
  fuelPrice: () => "/fuel-price",
  fuelPriceInState: (stateSlug: string) => `/fuel-price/${stateSlug}`,
  fuelPriceInCity: (stateSlug: string, citySlug: string) => `/fuel-price/${stateSlug}/${citySlug}`,

  // ---- Editorial ----------------------------------------------------
  newsCategory: (categorySlug: string) => `/news/${categorySlug}`,
  article: (categorySlug: string, articleSlug: string) =>
    `/news/${categorySlug}/${articleSlug}`,

  // ---- Compare ------------------------------------------------------
  compare: () => "/compare-cars",
  comparison: (comparisonSlug: string) => `/compare/${comparisonSlug}`,

  // ---- Tools --------------------------------------------------------
  // The calculators had no entries here, so nothing could link to them
  // without hand-writing the path.
  emiCalculator: () => "/car-loan-emi-calculator",
  downPaymentCalculator: () => "/down-payment-calculator",
  affordabilityCalculator: () => "/car-affordability-calculator",
  mileageCalculator: () => "/mileage-calculator",
  evChargingCalculator: () => "/ev-charging-time-calculator",
  fuelComparisonCalculator: () => "/fuel-comparison-calculator",

  stories: () => "/stories",
  profile: () => "/profile",
} as const;

// Canonical site origin, used for absolute URLs in metadata, the sitemap
// and robots.txt. Falls back to the production host so a missing env var
// cannot silently emit localhost URLs into a sitemap.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://timesauto.net"
).replace(/\/+$/, "");

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// ---- Chrome suppression --------------------------------------------
//
// Routes that render their own full-page chrome (dark fullscreen viewers,
// maintenance mode) and shouldn't get the site's Header/Footer. Checked by
// both components, so it lives here instead of being duplicated.
const CHROMELESS_PATTERNS = [
  /^\/maintenance$/,
  // "/tata-cars/nexon/photos" — the fullscreen photo viewer.
  /^\/[a-z0-9-]+-cars\/[a-z0-9-]+\/photos$/,
];

export function isChromelessRoute(pathname: string): boolean {
  return CHROMELESS_PATTERNS.some((pattern) => pattern.test(pathname));
}

// lib/sitemap.ts
//
// The site's URLs, grouped the way someone diagnosing indexation wants to
// read them.
//
// One flat sitemap answered "are we indexed" and nothing else. Split by
// section, Search Console reports submitted-versus-indexed per group, so
// "our model pages are fine but the fuel pages aren't" becomes visible
// instead of being averaged away across 1,500 URLs.
//
// lastmod is only emitted where a real date exists. Stamping every URL
// with the build time — which is what the old sitemap did, hourly —
// tells a crawler the whole site changed at once, every hour, and a
// crawler that learns the field is meaningless stops reading it.

import { getAllBrands } from "@/features/brands/brand.api";
import { getBodyTypes } from "@/features/bodyTypes/bodyType.api";
import { getCarsBrowse } from "@/features/cars/car.api";
import { getArticleCategories, getArticlesByCategoryPaginated } from "@/features/articles/article.api";
import { getFuelState, getFuelStates } from "@/features/fuel/fuel.api";
import { routes, absoluteUrl } from "@/lib/routes";

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
}

export const SITEMAP_SECTIONS = [
  "static",
  "brands",
  "models",
  "photos",
  "body-types",
  "news",
  "fuel",
] as const;

export type SitemapSection = (typeof SITEMAP_SECTIONS)[number];

// The browse endpoint caps limit at 48, so the catalogue is walked.
const PAGE_SIZE = 48;
const MAX_PAGES = 40;
const ARTICLES_PER_CATEGORY = 200;

async function allModels(): Promise<{ brandSlug: string; slug: string }[]> {
  const out: { brandSlug: string; slug: string }[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await getCarsBrowse({ page, limit: PAGE_SIZE });
    const cars = result?.cars ?? [];
    for (const car of cars) {
      if (car.brand?.slug && car.slug) out.push({ brandSlug: car.brand.slug, slug: car.slug });
    }
    if (cars.length < PAGE_SIZE) break;
  }
  return out;
}

const STATIC_PATHS: [string, SitemapEntry["changefreq"], number][] = [
  [routes.home(), "daily", 1],
  [routes.newCars(), "daily", 0.9],
  [routes.electricCars(), "daily", 0.8],
  [routes.upcomingCars(), "daily", 0.8],
  [routes.allBrands(), "weekly", 0.7],
  [routes.compare(), "weekly", 0.7],
  [routes.stories(), "weekly", 0.5],
  [routes.fuelPrice(), "daily", 0.8],
  ["/car-loan-emi-calculator", "monthly", 0.5],
  ["/mileage-calculator", "monthly", 0.5],
  ["/down-payment-calculator", "monthly", 0.5],
  ["/car-affordability-calculator", "monthly", 0.5],
  ["/ev-charging-time-calculator", "monthly", 0.5],
  ["/fuel-comparison-calculator", "monthly", 0.5],
];

// Every section fails soft: one unreachable API should cost that section,
// not collapse the whole sitemap to a 500.
export async function sectionEntries(section: SitemapSection): Promise<SitemapEntry[]> {
  switch (section) {
    case "static":
      return STATIC_PATHS.map(([path, changefreq, priority]) => ({
        loc: absoluteUrl(path),
        changefreq,
        priority,
      }));

    case "brands": {
      const brands = await getAllBrands().catch(() => []);
      return brands.map((b) => ({
        loc: absoluteUrl(routes.brand(b.slug)),
        changefreq: "weekly" as const,
        priority: 0.8,
      }));
    }

    case "models": {
      const models = await allModels().catch(() => []);
      return models.map((m) => ({
        loc: absoluteUrl(routes.model(m.brandSlug, m.slug)),
        changefreq: "weekly" as const,
        priority: 0.9,
      }));
    }

    case "photos": {
      const models = await allModels().catch(() => []);
      return models.map((m) => ({
        loc: absoluteUrl(routes.modelPhotos(m.brandSlug, m.slug)),
        changefreq: "monthly" as const,
        priority: 0.5,
      }));
    }

    case "body-types": {
      const bodyTypes = await getBodyTypes().catch(() => []);
      return bodyTypes.map((t) => ({
        loc: absoluteUrl(routes.bodyType(t.slug)),
        changefreq: "weekly" as const,
        priority: 0.7,
      }));
    }

    case "news": {
      const categories = await getArticleCategories().catch(() => []);
      const listing = categories.map((c) => ({
        loc: absoluteUrl(routes.newsCategory(c.slug)),
        changefreq: "daily" as const,
        priority: 0.6,
      }));

      // Article pages were absent from the sitemap entirely — the only
      // pages on the site with a real publication date, and the ones an
      // editor most wants found.
      const articles = (
        await Promise.all(
          categories.map((c) =>
            getArticlesByCategoryPaginated(c.slug, 1, ARTICLES_PER_CATEGORY)
              .then((r) => (r?.articles ?? []).map((a) => ({ category: c.slug, article: a })))
              .catch(() => []),
          ),
        )
      ).flat();

      return [
        ...listing,
        ...articles.map(({ category, article }) => ({
          loc: absoluteUrl(routes.article(category, article.slug)),
          lastmod: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
          changefreq: "monthly" as const,
          priority: 0.7,
        })),
      ];
    }

    case "fuel": {
      const states = await getFuelStates().catch(() => []);
      const cities = (
        await Promise.all(
          states.map(async (state) => {
            const detail = await getFuelState(state.slug).catch(() => null);
            return (detail?.cities ?? []).map((city) => ({
              stateSlug: state.slug,
              citySlug: city.citySlug,
            }));
          }),
        )
      ).flat();

      // These genuinely change every day, so today's date is honest here
      // in a way it would not be on a model page.
      const today = new Date().toISOString().slice(0, 10);
      return [
        ...states.map((s) => ({
          loc: absoluteUrl(routes.fuelPriceInState(s.slug)),
          lastmod: today,
          changefreq: "daily" as const,
          priority: 0.6,
        })),
        ...cities.map((c) => ({
          loc: absoluteUrl(routes.fuelPriceInCity(c.stateSlug, c.citySlug)),
          lastmod: today,
          changefreq: "daily" as const,
          priority: 0.5,
        })),
      ];
    }
  }
}

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

// A raw ampersand in a URL makes the whole sitemap unparseable, and a
// crawler rejects the file rather than the one entry.
export function xmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch]);
}

export function renderUrlSet(entries: SitemapEntry[]): string {
  const urls = entries
    .map((e) => {
      const parts = [`    <loc>${xmlEscape(e.loc)}</loc>`];
      if (e.lastmod) parts.push(`    <lastmod>${xmlEscape(e.lastmod)}</lastmod>`);
      if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
      if (e.priority !== undefined) parts.push(`    <priority>${e.priority}</priority>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderSitemapIndex(sections: readonly string[]): string {
  const items = sections
    .map((s) => `  <sitemap>\n    <loc>${xmlEscape(absoluteUrl(`/sitemaps/${s}.xml`))}</loc>\n  </sitemap>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
}

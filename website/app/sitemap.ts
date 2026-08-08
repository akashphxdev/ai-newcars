import type { MetadataRoute } from "next";
import { getAllBrands } from "@/features/brands/brand.api";
import { getBodyTypes } from "@/features/bodyTypes/bodyType.api";
import { getCarsBrowse } from "@/features/cars/car.api";
import { getArticleCategories } from "@/features/articles/article.api";
import { getFuelState, getFuelStates } from "@/features/fuel/fuel.api";
import { routes, absoluteUrl } from "@/lib/routes";

// Generated from the API rather than the sitemap_entries table, which is
// empty and would have to be maintained by hand. A crawler should never
// see a stale list, so this is rebuilt hourly.
export const revalidate = 3600;

// One page per model, so the whole catalogue has to be walked. The public
// browse endpoint caps limit at 48.
const PAGE_SIZE = 48;
const MAX_PAGES = 40; // 1,920 models — well clear of the current 455.

type Entry = MetadataRoute.Sitemap[number];

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: Entry[] = [
    { url: absoluteUrl(routes.home()), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl(routes.newCars()), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl(routes.electricCars()), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl(routes.upcomingCars()), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl(routes.allBrands()), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl(routes.compare()), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl(routes.stories()), lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: absoluteUrl(routes.fuelPrice()), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    ...[
      "/car-loan-emi-calculator",
      "/mileage-calculator",
      "/down-payment-calculator",
      "/car-affordability-calculator",
      "/ev-charging-time-calculator",
      "/fuel-comparison-calculator",
    ].map((path): Entry => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    })),
  ];

  // A failure in any one source would otherwise drop the whole sitemap to
  // a 500. Partial is far better than none.
  const [brands, bodyTypes, models, categories, fuelStates] = await Promise.all([
    getAllBrands().catch(() => []),
    getBodyTypes().catch(() => []),
    allModels().catch(() => []),
    getArticleCategories().catch(() => []),
    getFuelStates().catch(() => []),
  ]);

  // One entry per fuel city page. Petrol alone is enough to enumerate
  // them — a city we hold any price for holds petrol.
  const fuelCities = (
    await Promise.all(
      fuelStates.map(async (state) => {
        const detail = await getFuelState(state.slug);
        return (detail?.cities ?? []).map((city) => ({
          stateSlug: state.slug,
          citySlug: city.citySlug,
        }));
      }),
    )
  ).flat();

  return [
    ...staticEntries,
    ...brands.map((b): Entry => ({
      url: absoluteUrl(routes.brand(b.slug)),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
    ...bodyTypes.map((t): Entry => ({
      url: absoluteUrl(routes.bodyType(t.slug)),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    })),
    // Model pages are the point of the site, hence the highest non-home
    // priority; each also exposes its photo gallery.
    ...models.flatMap((m): Entry[] => [
      {
        url: absoluteUrl(routes.model(m.brandSlug, m.slug)),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.9,
      },
      {
        url: absoluteUrl(routes.modelPhotos(m.brandSlug, m.slug)),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      },
    ]),
    ...categories.map((c): Entry => ({
      url: absoluteUrl(routes.newsCategory(c.slug)),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    })),
    ...fuelStates.map((state): Entry => ({
      url: absoluteUrl(routes.fuelPriceInState(state.slug)),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    })),
    // Prices move daily, so these are the freshest pages on the site.
    ...fuelCities.map((city): Entry => ({
      url: absoluteUrl(routes.fuelPriceInCity(city.stateSlug, city.citySlug)),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.5,
    })),
  ];
}

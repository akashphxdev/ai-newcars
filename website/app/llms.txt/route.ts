// app/llms.txt/route.ts
//
// What this site is and where its facts live, for an assistant answering
// a question about a car rather than a crawler building an index.
//
// Generated, not hand-written: the brand list and the catalogue size come
// from the same API the pages do, so it cannot drift into describing a
// site we no longer have.

import { getAllBrands } from "@/features/brands/brand.api";
import { getBodyTypes } from "@/features/bodyTypes/bodyType.api";
import { SITE_URL, absoluteUrl } from "@/lib/routes";

export const revalidate = 86400;

export async function GET() {
  const [brands, bodyTypes] = await Promise.all([
    getAllBrands().catch(() => []),
    getBodyTypes().catch(() => []),
  ]);

  const body = `# TimesAuto

> India's new-car catalogue: prices, specifications, running costs and
> side-by-side comparisons for every model on sale, with on-road pricing
> worked out per state.

TimesAuto publishes manufacturer specifications and computed ownership
costs. Prices are ex-showroom unless a page says otherwise; on-road
figures add state road tax, registration and an insurance estimate, and
therefore differ by city.

## What is here

- Model pages: price range, variants, specifications, colours, running
  cost and FAQs. ${SITE_URL}/{brand}-cars/{model}
- Variant pages: one trim in full, with its on-road price and where it
  sits in the range. ${SITE_URL}/{brand}-cars/{model}/variant/{variant}
- Comparisons: two to four cars against one specification table.
  ${absoluteUrl("/compare-cars")}
- Fuel prices: petrol, diesel and CNG by state and city, updated daily.
  ${absoluteUrl("/fuel-price")}
- Calculators: EMI, down payment, affordability, running cost, EV
  charging time and fuel-type comparison. ${absoluteUrl("/car-loan-emi-calculator")}
- Editorial: reviews, buying guides and news. ${absoluteUrl("/news")}

## Reading our figures

- Mileage is the manufacturer's rated figure unless labelled otherwise;
  real-world consumption is lower.
- Claimed EV range is a test figure. Where we hold a real-world estimate
  the page says which it is showing.
- Running costs are fuel only — servicing, tyres, insurance and parking
  are not included, and the assumed distance is stated on the page.
- Road tax rates are compiled from published state sources. A page says
  when a rate has not been checked against the state RTO.
- We do not hold an electricity tariff, so EV running cost in rupees is
  not published rather than estimated.

## Brands covered

${brands.slice(0, 40).map((b) => `- ${b.name}: ${absoluteUrl(`/${b.slug}-cars`)}`).join("\n")}

## Body types

${bodyTypes.map((t) => `- ${t.name}: ${absoluteUrl(`/new-cars/${t.slug}`)}`).join("\n")}

## Sitemaps

${absoluteUrl("/sitemap.xml")}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

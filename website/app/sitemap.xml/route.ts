// app/sitemap.xml/route.ts
//
// The sitemap index. Replaces the single flat file: crawlers fetch this,
// then each section, and Search Console reports coverage per section
// rather than averaging 1,500 URLs into one number.

import { SITEMAP_SECTIONS, renderSitemapIndex } from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET() {
  return new Response(renderSitemapIndex(SITEMAP_SECTIONS), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

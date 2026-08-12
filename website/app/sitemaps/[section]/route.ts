// app/sitemaps/[section]/route.ts
//
// One sitemap per section of the site. The section list is closed, so an
// unknown name is a 404 rather than an empty urlset that would look like
// a section with nothing in it.

import { SITEMAP_SECTIONS, renderUrlSet, sectionEntries, type SitemapSection } from "@/lib/sitemap";

export const revalidate = 3600;

export function generateStaticParams() {
  return SITEMAP_SECTIONS.map((section) => ({ section: `${section}.xml` }));
}

export async function GET(_request: Request, ctx: { params: Promise<{ section: string }> }) {
  const { section } = await ctx.params;
  const name = section.replace(/\.xml$/, "") as SitemapSection;

  if (!SITEMAP_SECTIONS.includes(name)) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(renderUrlSet(await sectionEntries(name)), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

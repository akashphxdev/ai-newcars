// src/modules/public/seo/seoMeta/seoMeta.service.ts

import { prisma } from '@/prisma/client';
import { STATIC_PAGE_TYPE } from './seoMeta.validation';
import type { SeoMetaQueryParsed } from './seoMeta.validation';
import type { PublicSeoMetaRecord } from './seoMeta.types';

const SEO_META_PUBLIC_SELECT = {
  metaTitle: true,
  metaDescription: true,
  metaKeywords: true,
  canonicalUrl: true,
  h1Tag: true,
  ogTitle: true,
  ogDescription: true,
  ogImage: true,
  robotsMeta: true,
  vehicleSchema: true,
  reviewSchema: true,
  articleSchema: true,
  authorSchema: true,
  breadcrumbSchema: true,
} as const;

// Static pages are keyed by slug, not entityId (see admin seoMeta.service.ts's
// assertPageSlotAvailable for why entityId can't be the identity there).
// Dynamic pages (brand/model/variant/bodyType/newsCategory) try the
// specific entity row first, then fall back to the (entityId: null)
// "default template" row for that pageType — a page should never render
// with no title/description just because an editor hasn't gotten to that
// one entity yet.
export async function getPublicSeoMeta(query: SeoMetaQueryParsed): Promise<PublicSeoMetaRecord | null> {
  const { pageType, entityId, staticPageSlug } = query;

  if (pageType === STATIC_PAGE_TYPE) {
    if (!staticPageSlug) return null;
    return prisma.seoMeta.findFirst({
      where: { pageType, staticPageSlug, status: true },
      select: SEO_META_PUBLIC_SELECT,
    });
  }

  if (entityId != null) {
    const specific = await prisma.seoMeta.findFirst({
      where: { pageType, entityId, status: true },
      select: SEO_META_PUBLIC_SELECT,
    });
    if (specific) return specific;
  }

  return prisma.seoMeta.findFirst({
    where: { pageType, entityId: null, status: true },
    select: SEO_META_PUBLIC_SELECT,
  });
}

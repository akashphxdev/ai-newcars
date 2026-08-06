// src/modules/seo/seoMeta/seoMeta.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { STATIC_PAGE_TYPE } from './seoMeta.validation';
import type { SeoMetaListQueryParsed, CreateSeoMetaParsed, UpdateSeoMetaParsed } from './seoMeta.validation';
import type { SeoMetaRecord } from './seoMeta.types';

const SEO_META_SELECT = {
  id: true,
  pageType: true,
  entityId: true,
  staticPageSlug: true,
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
  faqSchema: true,
  reviewSchema: true,
  articleSchema: true,
  authorSchema: true,
  breadcrumbSchema: true,
  status: true,
  createdBy: true,
  createdByAdmin: { select: { id: true, name: true } },
  createdAt: true,
  updatedBy: true,
  updatedByAdmin: { select: { id: true, name: true } },
  updatedAt: true,
} as const;

// A (pageType, entityId) pair must be unique — otherwise two rows could
// both claim to be "the" SEO meta for the same page and which one the
// site renders becomes ambiguous. entityId can be null (the default
// template for that pageType), which is itself a value worth protecting.
//
// Static pages are the one exception: entityId is ALWAYS null for
// pageType = STATIC_PAGE_TYPE (there's no Brand/CarModel/CarVariant row
// to attach to), so "entityId" can't be the uniqueness key there — every
// static page would collide on (pageType, null). staticPageSlug is the
// real identity for that pageType instead.
async function assertPageSlotAvailable(
  pageType: number,
  entityId: number | null,
  staticPageSlug: string | null,
  excludeId?: number,
) {
  const isStatic = pageType === STATIC_PAGE_TYPE;

  const conflict = await prisma.seoMeta.findFirst({
    where: isStatic
      ? { pageType, staticPageSlug, id: excludeId ? { not: excludeId } : undefined }
      : { pageType, entityId, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });

  if (conflict) {
    throw ApiError.conflict(
      isStatic
        ? `SEO meta for the static page "${staticPageSlug}" already exists`
        : entityId === null
          ? `A default SEO meta template for this page type already exists`
          : `SEO meta for this page type + entity already exists`,
    );
  }
}

export async function listSeoMetas(query: SeoMetaListQueryParsed) {
  const { page, limit, search, pageType, entityId, status, sortBy, sortOrder } = query;

  const where: Prisma.SeoMetaWhereInput = {
    ...(search
      ? {
          OR: [
            { metaTitle: { contains: search, mode: 'insensitive' } },
            { staticPageSlug: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(pageType !== undefined ? { pageType } : {}),
    ...(entityId !== undefined ? { entityId } : {}),
    ...(status !== undefined ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.seoMeta.findMany({
      where,
      select: SEO_META_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.seoMeta.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getSeoMetaById(id: number): Promise<SeoMetaRecord> {
  const seoMeta = await prisma.seoMeta.findUnique({ where: { id }, select: SEO_META_SELECT });
  if (!seoMeta) {
    throw ApiError.notFound('SEO meta not found');
  }
  return seoMeta;
}

export async function createSeoMeta(
  input: CreateSeoMetaParsed,
  actorId: number,
  ipAddress?: string | null,
): Promise<SeoMetaRecord> {
  const entityId = input.entityId ?? null;
  const staticPageSlug = input.pageType === STATIC_PAGE_TYPE ? (input.staticPageSlug ?? null) : null;
  await assertPageSlotAvailable(input.pageType, entityId, staticPageSlug);

  const seoMeta = await prisma.seoMeta.create({
    data: {
      pageType: input.pageType,
      entityId,
      staticPageSlug,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      metaKeywords: input.metaKeywords ?? null,
      canonicalUrl: input.canonicalUrl ?? null,
      h1Tag: input.h1Tag ?? null,
      ogTitle: input.ogTitle ?? null,
      ogDescription: input.ogDescription ?? null,
      ogImage: input.ogImage ?? null,
      robotsMeta: input.robotsMeta ?? null,
      vehicleSchema: input.vehicleSchema ?? null,
      faqSchema: input.faqSchema ?? null,
      reviewSchema: input.reviewSchema ?? null,
      articleSchema: input.articleSchema ?? null,
      authorSchema: input.authorSchema ?? null,
      breadcrumbSchema: input.breadcrumbSchema ?? null,
      status: input.status,
      createdBy: actorId,
      updatedBy: actorId,
    },
    select: SEO_META_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created SEO meta (id ${seoMeta.id}, pageType ${seoMeta.pageType}, entityId ${seoMeta.entityId ?? 'default'})`,
    ipAddress,
  });

  return seoMeta;
}

export async function updateSeoMeta(
  id: number,
  input: UpdateSeoMetaParsed,
  actorId: number,
  ipAddress?: string | null,
): Promise<SeoMetaRecord> {
  const existing = await getSeoMetaById(id);
  const entityId = input.entityId ?? null;
  const staticPageSlug = input.pageType === STATIC_PAGE_TYPE ? (input.staticPageSlug ?? null) : null;

  if (
    input.pageType !== existing.pageType ||
    entityId !== existing.entityId ||
    staticPageSlug !== existing.staticPageSlug
  ) {
    await assertPageSlotAvailable(input.pageType, entityId, staticPageSlug, id);
  }

  const seoMeta = await prisma.seoMeta.update({
    where: { id },
    data: {
      pageType: input.pageType,
      entityId,
      staticPageSlug,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      metaKeywords: input.metaKeywords ?? null,
      canonicalUrl: input.canonicalUrl ?? null,
      h1Tag: input.h1Tag ?? null,
      ogTitle: input.ogTitle ?? null,
      ogDescription: input.ogDescription ?? null,
      ogImage: input.ogImage ?? null,
      robotsMeta: input.robotsMeta ?? null,
      vehicleSchema: input.vehicleSchema ?? null,
      faqSchema: input.faqSchema ?? null,
      reviewSchema: input.reviewSchema ?? null,
      articleSchema: input.articleSchema ?? null,
      authorSchema: input.authorSchema ?? null,
      breadcrumbSchema: input.breadcrumbSchema ?? null,
      status: input.status,
      updatedBy: actorId,
    },
    select: SEO_META_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated SEO meta (id ${seoMeta.id})`,
    ipAddress,
  });

  return seoMeta;
}

export async function updateSeoMetaStatus(
  id: number,
  status: boolean,
  actorId: number,
  ipAddress?: string | null,
): Promise<SeoMetaRecord> {
  await getSeoMetaById(id);

  const seoMeta = await prisma.seoMeta.update({
    where: { id },
    data: { status, updatedBy: actorId },
    select: SEO_META_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${status ? 'Activated' : 'Deactivated'} SEO meta (id ${id})`,
    ipAddress,
  });

  return seoMeta;
}

export async function deleteSeoMeta(id: number, actorId: number, ipAddress?: string | null) {
  const existing = await getSeoMetaById(id);

  await prisma.seoMeta.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted SEO meta (id ${existing.id}, pageType ${existing.pageType}, entityId ${existing.entityId ?? 'default'})`,
    ipAddress,
  });

  return { message: 'SEO meta deleted successfully' };
}
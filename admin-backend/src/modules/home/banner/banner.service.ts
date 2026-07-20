// src/modules/home/banner/banner.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type { BannerListQueryParsed, CreateBannerParsed, UpdateBannerParsed } from './banner.validation';
import type { BannerRecord, BannerUploadMediaResult } from './banner.types';

const BANNER_SELECT = {
  id: true,
  name: true,
  tagLabel: true,
  heading: true,
  highlightText: true,
  description: true,
  mediaType: true,
  imageUrl: true,
  videoUrl: true,
  ctaText: true,
  ctaLink: true,
  displayOrder: true,
  isActive: true,
  clickCount: true,
  createdBy: true,
  createdByAdmin: { select: { id: true, name: true } },
  updatedBy: true,
  updatedByAdmin: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
} as const;

export async function listBanners(query: BannerListQueryParsed) {
  const { page, limit, search, isActive, sortBy, sortOrder } = query;

  const where: Prisma.BannerWhereInput = {
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { heading: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.banner.findMany({
      where,
      select: BANNER_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.banner.count({ where }),
  ]);

  return {
    items: items as unknown as BannerRecord[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getBannerById(id: number): Promise<BannerRecord> {
  const banner = await prisma.banner.findUnique({
    where: { id },
    select: BANNER_SELECT,
  });

  if (!banner) {
    throw ApiError.notFound('Banner not found');
  }

  return banner as unknown as BannerRecord;
}

// Banner has separate imageUrl/videoUrl columns (not one shared
// mediaUrl like storyItem) — these two helpers keep the "only one of
// the two is ever populated, matching mediaType" rule in one place.
function mediaUrlFieldFor(mediaType: number): 'imageUrl' | 'videoUrl' {
  return mediaType === 1 ? 'imageUrl' : 'videoUrl';
}

// Banner has no DB-level unique constraint on displayOrder (unlike
// StoryGroup's `@@unique([displayOrder])`) — this is an app-level-only
// check, same shape as faq.service.ts's assertDisplayOrderAvailable,
// but without a DB constraint backing it there's a small race-condition
// window under concurrent saves. Flagged for a proper DB-level fix
// later; not something this app layer can add on its own.
async function assertDisplayOrderAvailable(displayOrder: number, excludeId?: number) {
  const conflict = await prisma.banner.findFirst({
    where: { displayOrder, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(`Display order ${displayOrder} is already used by another banner`);
  }
}

export async function createBanner(
  input: CreateBannerParsed,
  actorId: number,
  mediaFilename: string,
  ipAddress?: string | null,
) {
  await assertDisplayOrderAvailable(input.displayOrder);

  const urlField = mediaUrlFieldFor(input.mediaType);

  const banner = await prisma.banner.create({
    data: {
      name: input.name,
      tagLabel: input.tagLabel,
      heading: input.heading,
      highlightText: input.highlightText,
      description: input.description,
      mediaType: input.mediaType,
      ctaText: input.ctaText,
      ctaLink: input.ctaLink,
      displayOrder: input.displayOrder,
      isActive: input.isActive,
      // Media is required on create — controller already rejects the
      // request before this point if no file was uploaded.
      [urlField]: buildPublicPath('banners', mediaFilename),
      createdBy: actorId,
    },
    select: BANNER_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created banner "${banner.name}" (id ${banner.id})`,
    ipAddress,
  });

  return banner as unknown as BannerRecord;
}

// Full replace on every edit — same convention as offer.service.ts.
// Media is NOT touched here — it has its own dedicated route/mutation
// (uploadBannerMedia), same split as offer's image.
export async function updateBanner(
  id: number,
  input: UpdateBannerParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  await getBannerById(id);
  await assertDisplayOrderAvailable(input.displayOrder, id);

  const banner = await prisma.banner.update({
    where: { id },
    data: {
      name: input.name,
      tagLabel: input.tagLabel,
      heading: input.heading,
      highlightText: input.highlightText,
      description: input.description,
      mediaType: input.mediaType,
      ctaText: input.ctaText,
      ctaLink: input.ctaLink,
      displayOrder: input.displayOrder,
      isActive: input.isActive,
      updatedBy: actorId,
    },
    select: BANNER_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated banner "${banner.name}" (id ${id})`,
    ipAddress,
  });

  return banner as unknown as BannerRecord;
}

// Lightweight row-level Active/Inactive toggle — separate from the full
// edit mutation, same pattern as offer.service.ts's updateOfferStatus.
export async function updateBannerStatus(
  id: number,
  isActive: boolean,
  actorId: number,
  ipAddress?: string | null,
) {
  await getBannerById(id);

  const banner = await prisma.banner.update({
    where: { id },
    data: { isActive, updatedBy: actorId },
    select: BANNER_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${isActive ? 'Activated' : 'Deactivated'} banner "${banner.name}" (id ${id})`,
    ipAddress,
  });

  return banner as unknown as BannerRecord;
}

// Dedicated media-replace route — main PATCH /:id above stays
// JSON-only; swapping the file (image or video) always goes through
// here, same split as offer.service.ts's uploadOfferImage. Switching
// mediaType (e.g. image -> video) clears the now-unused column so a
// stale URL never lingers alongside the new one.
export async function uploadBannerMedia(
  id: number,
  mediaType: number,
  savedFilename: string,
  actorId: number,
  ipAddress?: string | null,
): Promise<BannerUploadMediaResult> {
  const existing = await getBannerById(id);

  const newUrlField = mediaUrlFieldFor(mediaType);
  const oldFileUrl = existing.mediaType === 1 ? existing.imageUrl : existing.videoUrl;
  const newFileUrl = buildPublicPath('banners', savedFilename);

  const banner = await prisma.banner.update({
    where: { id },
    data: {
      mediaType,
      imageUrl: newUrlField === 'imageUrl' ? newFileUrl : null,
      videoUrl: newUrlField === 'videoUrl' ? newFileUrl : null,
      updatedBy: actorId,
    },
    select: { id: true, mediaType: true, imageUrl: true, videoUrl: true },
  });

  // Only delete the old file AFTER the DB write succeeds — if the
  // update had failed we'd want the old media to remain intact.
  if (oldFileUrl) {
    await deleteUploadedFile(oldFileUrl);
  }

  await createLog({
    adminId: actorId,
    description: `Updated media for banner "${existing.name}" (id ${id})`,
    ipAddress,
  });

  return banner;
}

export async function deleteBanner(id: number, actorId: number, ipAddress?: string | null) {
  const banner = await getBannerById(id);

  await prisma.banner.delete({ where: { id } });

  // Banner row is gone — its media file on disk is now orphaned, clean
  // it up. Same order-of-operations as offer.service.ts's deleteOffer.
  const fileUrl = banner.mediaType === 1 ? banner.imageUrl : banner.videoUrl;
  if (fileUrl) {
    await deleteUploadedFile(fileUrl);
  }

  await createLog({
    adminId: actorId,
    description: `Deleted banner "${banner.name}" (id ${id})`,
    ipAddress,
  });

  return { message: 'Banner deleted successfully' };
}

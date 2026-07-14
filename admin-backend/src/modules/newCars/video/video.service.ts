// src/modules/newCars/video/video.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type { VideoListQueryParsed, CreateVideoParsed, UpdateVideoParsed } from './video.validation';
import type { VideoRecord, VideoUploadThumbnailResult } from './video.types';

const VIDEO_SELECT = {
  id: true,
  modelId: true,
  title: true,
  videoType: true,
  videoUrl: true,
  thumbnailUrl: true,
  durationSeconds: true,
  viewCount: true,
  publishedAt: true,
  isActive: true,
  createdAt: true,
  model: {
    select: {
      id: true,
      name: true,
      brand: { select: { id: true, name: true } },
    },
  },
} as const;

export async function listVideos(query: VideoListQueryParsed) {
  const { page, limit, search, modelId, videoType, isActive, sortBy, sortOrder } = query;

  const where: Prisma.CarVideoWhereInput = {
    ...(modelId ? { modelId } : {}),
    ...(typeof videoType === 'number' ? { videoType } : {}),
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.carVideo.findMany({
      where,
      select: VIDEO_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.carVideo.count({ where }),
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

export async function getVideoById(id: number): Promise<VideoRecord> {
  const video = await prisma.carVideo.findUnique({
    where: { id },
    select: VIDEO_SELECT,
  });

  if (!video) {
    throw ApiError.notFound('Video not found');
  }

  return video as unknown as VideoRecord;
}

// Every video must belong to a real, existing car model — same
// "validate the parent foreign key" rule as faq/variant/offer.service.ts.
async function assertModelExists(modelId: number) {
  const model = await prisma.carModel.findUnique({ where: { id: modelId }, select: { id: true } });
  if (!model) {
    throw ApiError.badRequest('Invalid modelId — car model does not exist');
  }
}

export async function createVideo(input: CreateVideoParsed, actorId: number, thumbnailFilename: string) {
  await assertModelExists(input.modelId);

  const video = await prisma.carVideo.create({
    data: {
      modelId: input.modelId,
      title: input.title,
      videoType: input.videoType,
      videoUrl: input.videoUrl,
      // Thumbnail is required on create — controller already rejects the
      // request before this point if no file was uploaded.
      thumbnailUrl: buildPublicPath('car-videos', thumbnailFilename),
      durationSeconds: input.durationSeconds,
      publishedAt: input.publishedAt,
      isActive: input.isActive,
    },
    select: VIDEO_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created video "${video.title}" (id ${video.id}) for "${video.model.brand.name} ${video.model.name}"`,
  });

  return video;
}

// Full replace on every edit — same convention as faq/variant/offer.
// Thumbnail is NOT touched here — it's replaced via the dedicated
// uploadVideoThumbnail() below (same split as Brand's logo).
export async function updateVideo(id: number, input: UpdateVideoParsed, actorId: number) {
  await getVideoById(id);
  await assertModelExists(input.modelId);

  const video = await prisma.carVideo.update({
    where: { id },
    data: {
      modelId: input.modelId,
      title: input.title,
      videoType: input.videoType,
      videoUrl: input.videoUrl,
      durationSeconds: input.durationSeconds,
      publishedAt: input.publishedAt,
      isActive: input.isActive,
    },
    select: VIDEO_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated video "${video.title}" (id ${id})`,
  });

  return video;
}

// Lightweight row-level Active/Inactive toggle — separate from the full
// update so flipping the switch doesn't need the whole edit form's payload.
export async function updateVideoStatus(id: number, isActive: boolean, actorId: number) {
  await getVideoById(id);

  const video = await prisma.carVideo.update({
    where: { id },
    data: { isActive },
    select: VIDEO_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${isActive ? 'Activated' : 'Deactivated'} video "${video.title}" (id ${id})`,
  });

  return video;
}

// `logoUrl`-style dedicated file-replace endpoint — same pattern as
// brand.service.ts's uploadBrandLogo / image.service.ts's replaceImageFile.
export async function uploadVideoThumbnail(
  id: number,
  savedFilename: string,
  actorId: number,
): Promise<VideoUploadThumbnailResult> {
  const existing = await getVideoById(id);

  const newThumbnailUrl = buildPublicPath('car-videos', savedFilename);

  const video = await prisma.carVideo.update({
    where: { id },
    data: { thumbnailUrl: newThumbnailUrl },
    select: { id: true, thumbnailUrl: true },
  });

  // Only delete the old file AFTER the DB write succeeds — if the update
  // had failed we'd want the old thumbnail to remain intact.
  await deleteUploadedFile(existing.thumbnailUrl);

  await createLog({
    adminId: actorId,
    description: `Updated thumbnail for video "${existing.title}" (id ${id})`,
  });

  return video as VideoUploadThumbnailResult;
}

export async function deleteVideo(id: number, actorId: number) {
  const video = await getVideoById(id);

  await prisma.carVideo.delete({ where: { id } });

  // Video row is gone — its thumbnail file on disk is now orphaned,
  // clean it up. Same order-of-operations as brand.service.ts's deleteBrand.
  await deleteUploadedFile(video.thumbnailUrl);

  await createLog({
    adminId: actorId,
    description: `Deleted video "${video.title}" (id ${id})`,
  });

  return { message: 'Video deleted successfully' };
}
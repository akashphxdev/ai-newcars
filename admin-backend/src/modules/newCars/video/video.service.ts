// src/modules/newCars/video/video.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type { VideoListQueryParsed, CreateVideoParsed, UpdateVideoParsed } from './video.validation';
import type { VideoRecord } from './video.types';

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
  const { page, limit, search, modelId, videoType, sortBy, sortOrder } = query;

  const where: Prisma.CarVideoWhereInput = {
    ...(modelId ? { modelId } : {}),
    ...(videoType ? { videoType } : {}),
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
// "validate the parent foreign key" rule as variant/faq/offer.service.ts.
async function assertModelExists(modelId: number) {
  const model = await prisma.carModel.findUnique({ where: { id: modelId }, select: { id: true } });
  if (!model) {
    throw ApiError.badRequest('Invalid modelId — car model does not exist');
  }
}

export async function createVideo(input: CreateVideoParsed, actorId: number) {
  await assertModelExists(input.modelId);

  const video = await prisma.carVideo.create({
    data: {
      modelId: input.modelId,
      title: input.title,
      videoType: input.videoType ?? null,
      videoUrl: input.videoUrl,
      thumbnailUrl: input.thumbnailUrl ?? null,
      durationSeconds: input.durationSeconds ?? null,
      publishedAt: input.publishedAt ?? null,
      // viewCount is intentionally omitted — it uses the schema default
      // of 0 and is never set directly from this form.
    },
    select: VIDEO_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created video "${video.title}" (id ${video.id}) under model id ${video.modelId}`,
  });

  return video;
}

// Full replace on every edit — same convention as faq/variant/offer,
// not a partial PATCH like Brand/CarModel. viewCount is never touched
// by this path — it's incremented elsewhere (e.g. a public-facing
// "watch" endpoint), not from the admin edit form.
export async function updateVideo(id: number, input: UpdateVideoParsed, actorId: number) {
  await getVideoById(id);
  await assertModelExists(input.modelId);

  const video = await prisma.carVideo.update({
    where: { id },
    data: {
      modelId: input.modelId,
      title: input.title,
      videoType: input.videoType ?? null,
      videoUrl: input.videoUrl,
      thumbnailUrl: input.thumbnailUrl ?? null,
      durationSeconds: input.durationSeconds ?? null,
      publishedAt: input.publishedAt ?? null,
    },
    select: VIDEO_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated video "${video.title}" (id ${id})`,
  });

  return video;
}

export async function deleteVideo(id: number, actorId: number) {
  const video = await getVideoById(id);

  await prisma.carVideo.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted video "${video.title}" (id ${id})`,
  });

  return { message: 'Video deleted successfully' };
}
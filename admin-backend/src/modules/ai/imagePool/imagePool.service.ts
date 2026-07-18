// src/modules/ai/imagePool/imagePool.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type { ImagePoolListQueryParsed } from './imagePool.validation';
import type { AiImagePoolRecord } from './imagePool.types';

const IMAGE_POOL_SELECT = {
  id: true,
  featureKey: true,
  imageUrl: true,
  originalFilename: true,
  isUsed: true,
  usedForId: true,
  usedAt: true,
  uploadedBy: true,
  uploadedByAdmin: { select: { id: true, name: true } },
  createdAt: true,
} as const;

export async function listImagePool(query: ImagePoolListQueryParsed) {
  const { page, limit, featureKey, isUsed } = query;

  const where: Prisma.AiImagePoolWhereInput = {
    ...(featureKey ? { featureKey } : {}),
    ...(isUsed !== undefined ? { isUsed } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.aiImagePool.findMany({
      where,
      select: IMAGE_POOL_SELECT,
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.aiImagePool.count({ where }),
  ]);

  return {
    items: items as unknown as AiImagePoolRecord[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function createImagePoolEntries(
  featureKey: number,
  files: Express.Multer.File[],
  actorId: number,
  ipAddress?: string | null,
): Promise<AiImagePoolRecord[]> {
  if (files.length === 0) {
    throw ApiError.badRequest('No image file(s) received (expected field name "images")');
  }

  const created = await prisma.$transaction(
    files.map((file) =>
      prisma.aiImagePool.create({
        data: {
          featureKey,
          imageUrl: buildPublicPath('ai-pool', file.filename),
          originalFilename: file.originalname,
          uploadedBy: actorId,
        },
        select: IMAGE_POOL_SELECT,
      }),
    ),
  );

  await createLog({
    adminId: actorId,
    description: `Uploaded ${created.length} image(s) to the AI image pool (feature ${featureKey})`,
    ipAddress,
  });

  return created as unknown as AiImagePoolRecord[];
}

export async function deleteImagePoolEntry(id: number, actorId: number, ipAddress?: string | null) {
  const existing = await prisma.aiImagePool.findUnique({
    where: { id },
    select: { id: true, imageUrl: true, isUsed: true },
  });

  if (!existing) {
    throw ApiError.notFound('Image not found in the pool');
  }

  await prisma.aiImagePool.delete({ where: { id } });
  await deleteUploadedFile(existing.imageUrl);

  await createLog({
    adminId: actorId,
    description: `Deleted ${existing.isUsed ? 'used' : 'unused'} AI image pool entry (id ${id})`,
    ipAddress,
  });

  return { message: 'Image deleted successfully' };
}
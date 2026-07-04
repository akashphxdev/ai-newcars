// src/modules/newCars/image/image.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type { CreateImageParsed, ImageListQueryParsed, UpdateImageParsed } from './image.validation';
import type { ImageReplaceFileResult } from './image.types';

const IMAGE_SELECT = {
  id: true,
  modelId: true,
  variantId: true,
  imageUrl: true,
  isPrimary: true,
  angle: true,
  model: {
    select: { id: true, name: true },
  },
  variant: {
    select: { id: true, variantName: true },
  },
} as const;

async function assertModelExists(modelId: number) {
  const model = await prisma.carModel.findUnique({ where: { id: modelId }, select: { id: true } });
  if (!model) {
    throw ApiError.badRequest('Invalid modelId — car model does not exist');
  }
}

async function assertVariantBelongsToModel(variantId: number, modelId: number) {
  const variant = await prisma.carVariant.findUnique({
    where: { id: variantId },
    select: { id: true, modelId: true },
  });
  if (!variant) {
    throw ApiError.badRequest('Invalid variantId — variant does not exist');
  }
  if (variant.modelId !== modelId) {
    throw ApiError.badRequest('This variant does not belong to the given modelId');
  }
}

export async function listImages(query: ImageListQueryParsed) {
  const { page, limit, modelId, variantId, angle, isPrimary, sortBy, sortOrder } = query;

  const where: Prisma.CarImageWhereInput = {
    ...(modelId ? { modelId } : {}),
    ...(variantId ? { variantId } : {}),
    ...(angle ? { angle } : {}),
    ...(typeof isPrimary === 'boolean' ? { isPrimary } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.carImage.findMany({
      where,
      select: IMAGE_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.carImage.count({ where }),
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

export async function getImageById(id: number) {
  const image = await prisma.carImage.findUnique({
    where: { id },
    select: IMAGE_SELECT,
  });

  if (!image) {
    throw ApiError.notFound('Image not found');
  }

  return image;
}

export async function createImage(input: CreateImageParsed, actorId: number, imageFilename: string) {
  await assertModelExists(input.modelId);
  if (input.variantId) {
    await assertVariantBelongsToModel(input.variantId, input.modelId);
  }

  const image = await prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.carImage.updateMany({
        where: { modelId: input.modelId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return tx.carImage.create({
      data: {
        modelId: input.modelId,
        variantId: input.variantId,
        angle: input.angle,
        isPrimary: input.isPrimary ?? false,
        imageUrl: buildPublicPath('car-images', imageFilename),
      },
      select: IMAGE_SELECT,
    });
  });

  await createLog({
    adminId: actorId,
    description: `Uploaded image (id ${image.id}) for car model id ${image.modelId}`,
  });

  return image;
}

export async function updateImage(id: number, input: UpdateImageParsed, actorId: number) {
  const existing = await getImageById(id);

  const targetModelId = input.modelId ?? existing.modelId;
  if (typeof input.modelId === 'number') {
    await assertModelExists(input.modelId);
  }
  if (typeof input.variantId === 'number') {
    await assertVariantBelongsToModel(input.variantId, targetModelId);
  }

  const image = await prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.carImage.updateMany({
        where: { modelId: targetModelId, isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    return tx.carImage.update({
      where: { id },
      data: input,
      select: IMAGE_SELECT,
    });
  });

  await createLog({
    adminId: actorId,
    description: `Updated image (id ${id}) — fields: ${Object.keys(input).join(', ')}`,
  });

  return image;
}

// Dedicated quick toggle for the gallery's "set as cover" action —
// mirrors brand.service.ts's updateBrandStatus in shape/simplicity.
export async function setPrimaryImage(id: number, isPrimary: boolean, actorId: number) {
  const existing = await getImageById(id);

  const image = await prisma.$transaction(async (tx) => {
    if (isPrimary) {
      await clearOtherPrimaryFlagsTx(tx, existing.modelId, id);
    }
    return tx.carImage.update({
      where: { id },
      data: { isPrimary },
      select: IMAGE_SELECT,
    });
  });

  await createLog({
    adminId: actorId,
    description: `${isPrimary ? 'Set' : 'Unset'} image (id ${id}) as primary for model id ${existing.modelId}`,
  });

  return image;
}

// Transaction-bound variant of clearOtherPrimaryFlags — kept separate
// so the standalone (non-transactional) helper above stays usable for
// simpler call sites that don't need one.
async function clearOtherPrimaryFlagsTx(
  tx: Prisma.TransactionClient,
  modelId: number,
  exceptId: number,
) {
  await tx.carImage.updateMany({
    where: { modelId, isPrimary: true, id: { not: exceptId } },
    data: { isPrimary: false },
  });
}

export async function deleteImage(id: number, actorId: number) {
  const image = await getImageById(id);

  await prisma.carImage.delete({ where: { id } });

  // Row is gone — its file on disk is now orphaned, clean it up.
  await deleteUploadedFile(image.imageUrl);

  await createLog({
    adminId: actorId,
    description: `Deleted image (id ${id}) for car model id ${image.modelId}`,
  });

  return { message: 'Image deleted successfully' };
}

export async function replaceImageFile(
  id: number,
  savedFilename: string,
  actorId: number,
): Promise<ImageReplaceFileResult> {
  const existing = await getImageById(id);

  const newImageUrl = buildPublicPath('car-images', savedFilename);

  const image = await prisma.carImage.update({
    where: { id },
    data: { imageUrl: newImageUrl },
    select: { id: true, imageUrl: true },
  });

  // Only delete the old file AFTER the DB write succeeds.
  await deleteUploadedFile(existing.imageUrl);

  await createLog({
    adminId: actorId,
    description: `Replaced file for image (id ${id})`,
  });

  return image as ImageReplaceFileResult;
}
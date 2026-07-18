// src/modules/newCars/image/image.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type {
  CreateImageParsed,
  ImageListQueryParsed,
  UpdateImageParsed,
  BulkCreateImagesParsed,
} from './image.validation';
import type { ImageReplaceFileResult } from './image.types';

const IMAGE_SELECT = {
  id: true,
  modelId: true,
  variantId: true,
  colorId: true,
  imageUrl: true,
  isPrimary: true,
  angle: true,
  model: {
    select: { id: true, name: true },
  },
  variant: {
    select: { id: true, variantName: true },
  },
  color: {
    select: { id: true, colorName: true },
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

async function assertColorBelongsToModel(colorId: number, modelId: number) {
  const color = await prisma.carColor.findUnique({
    where: { id: colorId },
    select: { id: true, modelId: true },
  });
  if (!color) {
    throw ApiError.badRequest('Invalid colorId — color does not exist');
  }
  if (color.modelId !== modelId) {
    throw ApiError.badRequest('This color does not belong to the given modelId');
  }
}

export async function listImages(query: ImageListQueryParsed) {
  const { page, limit, modelId, variantId, colorId, angle, isPrimary, sortBy, sortOrder } = query;

  const where: Prisma.CarImageWhereInput = {
    ...(modelId ? { modelId } : {}),
    ...(variantId ? { variantId } : {}),
    ...(colorId ? { colorId } : {}),
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

export async function createImage(
  input: CreateImageParsed,
  actorId: number,
  imageFilename: string,
  ipAddress?: string | null,
) {
  await assertModelExists(input.modelId);
  if (input.variantId) {
    await assertVariantBelongsToModel(input.variantId, input.modelId);
  }
  if (input.colorId) {
    await assertColorBelongsToModel(input.colorId, input.modelId);
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
        colorId: input.colorId,
        angle: input.angle,
        isPrimary: input.isPrimary ?? false,
        imageUrl: buildPublicPath('car-images', imageFilename),
      },
      select: IMAGE_SELECT,
    });
  });

  await createLog({
    adminId: actorId,
    description: `Uploaded image (id ${image.id}) for "${image.model.name}"`,
    ipAddress,
  });

  return image;
}

// POST /images/bulk — same shape as createImage but for N files in one
// call/transaction. None of the created rows are marked primary (see the
// comment on bulkCreateImagesSchema) — that stays a deliberate one-at-a-
// time choice via setPrimaryImage.
export async function createImagesBulk(
  input: BulkCreateImagesParsed,
  actorId: number,
  filenames: string[],
  ipAddress?: string | null,
) {
  if (filenames.length === 0) {
    throw ApiError.badRequest('No image files received (expected field name "images")');
  }

  await assertModelExists(input.modelId);
  if (input.variantId) {
    await assertVariantBelongsToModel(input.variantId, input.modelId);
  }
  if (input.colorId) {
    await assertColorBelongsToModel(input.colorId, input.modelId);
  }

  const images = await prisma.$transaction((tx) =>
    Promise.all(
      filenames.map((filename) =>
        tx.carImage.create({
          data: {
            modelId: input.modelId,
            variantId: input.variantId,
            colorId: input.colorId,
            angle: input.angle,
            isPrimary: false,
            imageUrl: buildPublicPath('car-images', filename),
          },
          select: IMAGE_SELECT,
        }),
      ),
    ),
  );

  await createLog({
    adminId: actorId,
    description: `Bulk-uploaded ${images.length} image(s) for "${images[0]?.model.name ?? input.modelId}"`,
    ipAddress,
  });

  return images;
}

export async function updateImage(
  id: number,
  input: UpdateImageParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await getImageById(id);

  const targetModelId = input.modelId ?? existing.modelId;
  const modelIsChanging = typeof input.modelId === 'number' && input.modelId !== existing.modelId;

  if (typeof input.modelId === 'number') {
    await assertModelExists(input.modelId);
  }

  if (typeof input.variantId === 'number') {
    await assertVariantBelongsToModel(input.variantId, targetModelId);
  } else if (input.variantId === undefined && modelIsChanging && existing.variantId != null) {
    // modelId is changing but variantId wasn't touched in this request —
    // the existing variant link would now point at a variant under the
    // OLD model, which is inconsistent. Re-validate it against the new
    // model instead of silently leaving stale/mismatched data; if it
    // doesn't belong, the caller must explicitly pass a new variantId
    // (or null to clear it).
    await assertVariantBelongsToModel(existing.variantId, targetModelId);
  }

  if (typeof input.colorId === 'number') {
    await assertColorBelongsToModel(input.colorId, targetModelId);
  } else if (input.colorId === undefined && modelIsChanging && existing.colorId != null) {
    // Same reasoning as variantId above.
    await assertColorBelongsToModel(existing.colorId, targetModelId);
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
    description: `Updated image (id ${id}) for "${image.model.name}"`,
    ipAddress,
  });

  return image;
}

// Dedicated quick toggle for the gallery's "set as cover" action —
// mirrors brand.service.ts's updateBrandStatus in shape/simplicity.
export async function setPrimaryImage(
  id: number,
  isPrimary: boolean,
  actorId: number,
  ipAddress?: string | null,
) {
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
    description: `${isPrimary ? 'Set' : 'Unset'} image (id ${id}) as primary for "${existing.model.name}"`,
    ipAddress,
  });

  return image;
}

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

export async function deleteImage(id: number, actorId: number, ipAddress?: string | null) {
  const image = await getImageById(id);

  await prisma.carImage.delete({ where: { id } });

  // Row is gone — its file on disk is now orphaned, clean it up.
  await deleteUploadedFile(image.imageUrl);

  await createLog({
    adminId: actorId,
    description: `Deleted image (id ${id}) for "${image.model.name}"`,
    ipAddress,
  });

  return { message: 'Image deleted successfully' };
}

export async function replaceImageFile(
  id: number,
  savedFilename: string,
  actorId: number,
  ipAddress?: string | null,
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
    description: `Replaced file for image (id ${id}) on "${existing.model.name}"`,
    ipAddress,
  });

  return image as ImageReplaceFileResult;
}
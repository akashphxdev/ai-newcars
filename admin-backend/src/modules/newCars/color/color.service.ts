// src/modules/newCars/color/color.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type { ColorListQueryParsed, CreateColorParsed, UpdateColorParsed } from './color.validation';
import type { ColorUploadImageResult } from './color.types';

const COLOR_SELECT = {
  id: true,
  modelId: true,
  colorName: true,
  imageUrl: true,
  additionalCost: true,
  model: {
    select: { id: true, name: true },
  },
  // Ordered so a multi-shade swatch always renders shades in the order
  // the admin arranged them.
  shades: {
    select: { id: true, colorHex: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

async function assertModelExists(modelId: number) {
  const model = await prisma.carModel.findUnique({ where: { id: modelId }, select: { id: true } });
  if (!model) {
    throw ApiError.badRequest('Invalid modelId — car model does not exist');
  }
}

export async function listColors(query: ColorListQueryParsed) {
  const { page, limit, search, modelId, sortBy, sortOrder } = query;

  const where: Prisma.CarColorWhereInput = {
    ...(modelId ? { modelId } : {}),
    ...(search
      ? {
          colorName: { contains: search, mode: 'insensitive' },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.carColor.findMany({
      where,
      select: COLOR_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.carColor.count({ where }),
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

export async function getColorById(id: number) {
  const color = await prisma.carColor.findUnique({
    where: { id },
    select: COLOR_SELECT,
  });

  if (!color) {
    throw ApiError.notFound('Color not found');
  }

  return color;
}

export async function createColor(
  input: CreateColorParsed,
  actorId: number,
  imageFilename?: string,
  ipAddress?: string | null,
) {
  await assertModelExists(input.modelId);

  const color = await prisma.carColor.create({
    data: {
      modelId: input.modelId,
      colorName: input.colorName,
      additionalCost: input.additionalCost,
      imageUrl: imageFilename ? buildPublicPath('colors', imageFilename) : undefined,
      shades: input.colorHexes
        ? {
            create: input.colorHexes.map((hex, i) => ({ colorHex: hex, sortOrder: i })),
          }
        : undefined,
    },
    select: COLOR_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created color "${color.colorName}" (id ${color.id}) for "${color.model.name}"`,
    ipAddress,
  });

  return color;
}

export async function updateColor(
  id: number,
  input: UpdateColorParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  await getColorById(id);

  if (typeof input.modelId === 'number') {
    await assertModelExists(input.modelId);
  }

  const { colorHexes, ...rest } = input;

  const color = await prisma.$transaction(async (tx) => {
    if (colorHexes) {
      // colorHexes replaces the full shade list — simplest, least
      // error-prone semantics for "send the complete desired set" rather
      // than diffing individual shade rows.
      await tx.carColorShade.deleteMany({ where: { colorId: id } });
      await tx.carColorShade.createMany({
        data: colorHexes.map((hex, i) => ({ colorId: id, colorHex: hex, sortOrder: i })),
      });
    }

    return tx.carColor.update({
      where: { id },
      data: rest,
      select: COLOR_SELECT,
    });
  });

  await createLog({
    adminId: actorId,
    description: `Updated color "${color.colorName}" (id ${color.id}) for "${color.model.name}"`,
    ipAddress,
  });

  return color;
}

export async function deleteColor(id: number, actorId: number, ipAddress?: string | null) {
  const color = await getColorById(id);

  // Shades cascade-delete at the DB level (onDelete: Cascade), but images
  // tagged with this colorId do NOT (their colorId is just cleared —
  // deleting a color shouldn't silently delete someone's photos).
  await prisma.carColor.delete({ where: { id } });

  // Row is gone — its swatch/color image on disk (if any) is now
  // orphaned, clean it up. Same order-of-operations as brand.service.ts.
  await deleteUploadedFile(color.imageUrl);

  await createLog({
    adminId: actorId,
    description: `Deleted color "${color.colorName}" (id ${id}) from "${color.model.name}"`,
    ipAddress,
  });

  return { message: 'Color deleted successfully' };
}

export async function uploadColorImage(
  id: number,
  savedFilename: string,
  actorId: number,
  ipAddress?: string | null,
): Promise<ColorUploadImageResult> {
  const existing = await getColorById(id);

  const newImageUrl = buildPublicPath('colors', savedFilename);

  const color = await prisma.carColor.update({
    where: { id },
    data: { imageUrl: newImageUrl },
    select: { id: true, imageUrl: true },
  });

  // Only delete the old file AFTER the DB write succeeds.
  await deleteUploadedFile(existing.imageUrl);

  await createLog({
    adminId: actorId,
    description: `Updated image for color "${existing.colorName}" (id ${id}) on "${existing.model.name}"`,
    ipAddress,
  });

  return color as ColorUploadImageResult;
}
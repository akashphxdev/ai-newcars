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
  colorHex: true,
  isDualTone: true,
  imageUrl: true,
  additionalCost: true,
  model: {
    select: { id: true, name: true },
  },
} as const;

async function assertModelExists(modelId: number) {
  const model = await prisma.carModel.findUnique({ where: { id: modelId }, select: { id: true } });
  if (!model) {
    throw ApiError.badRequest('Invalid modelId — car model does not exist');
  }
}

export async function listColors(query: ColorListQueryParsed) {
  const { page, limit, search, modelId, isDualTone, sortBy, sortOrder } = query;

  const where: Prisma.CarColorWhereInput = {
    ...(modelId ? { modelId } : {}),
    ...(typeof isDualTone === 'boolean' ? { isDualTone } : {}),
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
) {
  await assertModelExists(input.modelId);

  const color = await prisma.carColor.create({
    data: {
      modelId: input.modelId,
      colorName: input.colorName,
      colorHex: input.colorHex,
      isDualTone: input.isDualTone ?? false,
      additionalCost: input.additionalCost,
      imageUrl: imageFilename ? buildPublicPath('colors', imageFilename) : undefined,
    },
    select: COLOR_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created color "${color.colorName}" (id ${color.id}) for car model id ${color.modelId}`,
  });

  return color;
}

export async function updateColor(id: number, input: UpdateColorParsed, actorId: number) {
  await getColorById(id);

  if (typeof input.modelId === 'number') {
    await assertModelExists(input.modelId);
  }

  const color = await prisma.carColor.update({
    where: { id },
    data: input,
    select: COLOR_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated color "${color.colorName}" (id ${color.id}) — fields: ${Object.keys(input).join(', ')}`,
  });

  return color;
}

export async function deleteColor(id: number, actorId: number) {
  const color = await getColorById(id);

  await prisma.carColor.delete({ where: { id } });

  // Row is gone — its swatch/color image on disk (if any) is now
  // orphaned, clean it up. Same order-of-operations as brand.service.ts.
  await deleteUploadedFile(color.imageUrl);

  await createLog({
    adminId: actorId,
    description: `Deleted color "${color.colorName}" (id ${id})`,
  });

  return { message: 'Color deleted successfully' };
}

export async function uploadColorImage(
  id: number,
  savedFilename: string,
  actorId: number,
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
    description: `Updated image for color "${existing.colorName}" (id ${id})`,
  });

  return color as ColorUploadImageResult;
}
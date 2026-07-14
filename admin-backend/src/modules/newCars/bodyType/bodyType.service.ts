// src/modules/newCars/bodyType/bodyType.service.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type {
  BodyTypeListQueryParsed,
  CreateBodyTypeParsed,
  UpdateBodyTypeParsed,
} from './bodyType.validation';
import type { BodyTypeUploadIconResult } from './bodyType.types';

const BODY_TYPE_SELECT = {
  id: true,
  name: true,
  slug: true,
  iconUrl: true,
  description: true,
  createdAt: true,
} as const;

async function assertSlugAvailable(slug: string, excludeId?: number) {
  const conflict = await prisma.bodyType.findFirst({
    where: { slug, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(`A body type with the slug "${slug}" already exists`);
  }
}

export async function listBodyTypes(query: BodyTypeListQueryParsed) {
  const { page, limit, search, sortBy, sortOrder } = query;

  const where: Prisma.BodyTypeWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.bodyType.findMany({
      where,
      select: BODY_TYPE_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bodyType.count({ where }),
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

// Dropdown-only source — every body type in one shot, no pagination.
// Use this (not listBodyTypes) wherever BodyType is just a <select>:
// CarModel forms.
export async function listBodyTypeOptions() {
  return prisma.bodyType.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

export async function getBodyTypeById(id: number) {
  const bodyType = await prisma.bodyType.findUnique({
    where: { id },
    select: BODY_TYPE_SELECT,
  });

  if (!bodyType) {
    throw ApiError.notFound('Body type not found');
  }

  return bodyType;
}

export async function createBodyType(
  input: CreateBodyTypeParsed,
  actorId: number,
  iconFilename: string,
) {
  await assertSlugAvailable(input.slug);

  const bodyType = await prisma.bodyType.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      iconUrl: buildPublicPath('bodytypes', iconFilename),
    },
    select: BODY_TYPE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created body type "${bodyType.name}" (id ${bodyType.id}, slug "${bodyType.slug}")`,
  });

  return bodyType;
}

export async function updateBodyType(id: number, input: UpdateBodyTypeParsed, actorId: number) {
  const existing = await getBodyTypeById(id);

  if (input.slug !== existing.slug) {
    await assertSlugAvailable(input.slug, id);
  }

  const bodyType = await prisma.bodyType.update({
    where: { id },
    data: { ...input },
    select: BODY_TYPE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated body type "${bodyType.name}" (id ${bodyType.id})`,
  });

  return bodyType;
}

export async function deleteBodyType(id: number, actorId: number) {
  const bodyType = await getBodyTypeById(id);

  const carModelCount = await prisma.carModel.count({ where: { bodyTypeId: id } });
  if (carModelCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete this body type — ${carModelCount} car model(s) are linked to it. Delete or reassign them first.`,
    );
  }

  await prisma.bodyType.delete({ where: { id } });

  await deleteUploadedFile(bodyType.iconUrl);

  await createLog({
    adminId: actorId,
    description: `Deleted body type "${bodyType.name}" (id ${id})`,
  });

  return { message: 'Body type deleted successfully' };
}

export async function uploadBodyTypeIcon(
  id: number,
  savedFilename: string,
  actorId: number,
): Promise<BodyTypeUploadIconResult> {
  const existing = await getBodyTypeById(id);

  const newIconUrl = buildPublicPath('bodytypes', savedFilename);

  const bodyType = await prisma.bodyType.update({
    where: { id },
    data: { iconUrl: newIconUrl },
    select: { id: true, iconUrl: true },
  });

  await deleteUploadedFile(existing.iconUrl);

  await createLog({
    adminId: actorId,
    description: `Updated icon for body type "${existing.name}" (id ${id})`,
  });

  return bodyType as BodyTypeUploadIconResult;
}
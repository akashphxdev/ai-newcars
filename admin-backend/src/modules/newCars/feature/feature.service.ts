// src/modules/newCars/feature/feature.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type { FeatureListQueryParsed, CreateFeatureParsed, UpdateFeatureParsed } from './feature.validation';

const FEATURE_SELECT = {
  id: true,
  name: true,
  categoryId: true,
  category: { select: { id: true, name: true } },
  createdAt: true,
} as const;

async function assertNameAvailable(name: string, excludeId?: number) {
  const conflict = await prisma.feature.findFirst({
    where: { name, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(`A feature named "${name}" already exists`);
  }
}

async function assertCategoryExists(categoryId: number) {
  const category = await prisma.featureCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) {
    throw ApiError.badRequest('Invalid categoryId — feature category does not exist');
  }
}

export async function listFeatures(query: FeatureListQueryParsed) {
  const { page, limit, search, categoryId } = query;

  const where: Prisma.FeatureWhereInput = {
    ...(categoryId ? { categoryId } : {}),
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.feature.findMany({
      where,
      select: FEATURE_SELECT,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.feature.count({ where }),
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

// Dropdown-only source — every feature in one shot, no pagination.
// (Category-grouped catalog for the variant-assignment checklist lives
// in variantFeature.service.ts's getFeatureCatalog — a different shape
// for a different screen.)
export async function listFeatureOptions() {
  return prisma.feature.findMany({
    select: { id: true, name: true, categoryId: true },
    orderBy: { name: 'asc' },
  });
}

export async function getFeatureById(id: number) {
  const feature = await prisma.feature.findUnique({
    where: { id },
    select: FEATURE_SELECT,
  });

  if (!feature) {
    throw ApiError.notFound('Feature not found');
  }

  return feature;
}

export async function createFeature(input: CreateFeatureParsed, actorId: number, ipAddress?: string | null) {
  await assertCategoryExists(input.categoryId);
  await assertNameAvailable(input.name);

  const feature = await prisma.feature.create({
    data: input,
    select: FEATURE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created feature "${feature.name}" (id ${feature.id})`,
    ipAddress,
  });

  return feature;
}

export async function updateFeature(
  id: number,
  input: UpdateFeatureParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  await getFeatureById(id);

  if (input.name) {
    await assertNameAvailable(input.name, id);
  }
  if (input.categoryId) {
    await assertCategoryExists(input.categoryId);
  }

  const feature = await prisma.feature.update({
    where: { id },
    data: input,
    select: FEATURE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated feature "${feature.name}" (id ${id})`,
    ipAddress,
  });

  return feature;
}

export async function deleteFeature(id: number, actorId: number, ipAddress?: string | null) {
  const feature = await getFeatureById(id);

  const assignedCount = await prisma.variantFeature.count({ where: { featureId: id } });
  if (assignedCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete this feature — it is currently assigned to ${assignedCount} variant(s). Remove those assignments first.`,
    );
  }

  await prisma.feature.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted feature "${feature.name}" (id ${id})`,
    ipAddress,
  });

  return { message: 'Feature deleted successfully' };
}

// src/modules/newCars/featureCategory/featureCategory.service.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type {
  FeatureCategoryListQueryParsed,
  CreateFeatureCategoryParsed,
  UpdateFeatureCategoryParsed,
} from './featureCategory.validation';

const FEATURE_CATEGORY_SELECT = {
  id: true,
  name: true,
  sortOrder: true,
  createdAt: true,
} as const;

async function assertNameAvailable(name: string, excludeId?: number) {
  const conflict = await prisma.featureCategory.findFirst({
    where: { name, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(`A feature category named "${name}" already exists`);
  }
}

async function assertSortOrderAvailable(sortOrder: number, excludeId?: number) {
  const conflict = await prisma.featureCategory.findFirst({
    where: { sortOrder, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(`Sort order ${sortOrder} is already used by another category`);
  }
}

export async function listFeatureCategories(query: FeatureCategoryListQueryParsed) {
  const { page, limit, search } = query;

  const where: Prisma.FeatureCategoryWhereInput = {
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.featureCategory.findMany({
      where,
      select: FEATURE_CATEGORY_SELECT,
      orderBy: { sortOrder: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.featureCategory.count({ where }),
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

// Dropdown-only source — every category in one shot, no pagination.
// Use this wherever FeatureCategory is just a <select>: the Feature form.
export async function listFeatureCategoryOptions() {
  return prisma.featureCategory.findMany({
    select: { id: true, name: true },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getFeatureCategoryById(id: number) {
  const category = await prisma.featureCategory.findUnique({
    where: { id },
    select: FEATURE_CATEGORY_SELECT,
  });

  if (!category) {
    throw ApiError.notFound('Feature category not found');
  }

  return category;
}

export async function createFeatureCategory(
  input: CreateFeatureCategoryParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  await assertNameAvailable(input.name);
  await assertSortOrderAvailable(input.sortOrder);

  const category = await prisma.featureCategory.create({
    data: input,
    select: FEATURE_CATEGORY_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created feature category "${category.name}" (id ${category.id})`,
    ipAddress,
  });

  return category;
}

export async function updateFeatureCategory(
  id: number,
  input: UpdateFeatureCategoryParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  await getFeatureCategoryById(id);

  if (input.name) {
    await assertNameAvailable(input.name, id);
  }
  if (input.sortOrder !== undefined) {
    await assertSortOrderAvailable(input.sortOrder, id);
  }

  const category = await prisma.featureCategory.update({
    where: { id },
    data: input,
    select: FEATURE_CATEGORY_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated feature category "${category.name}" (id ${id})`,
    ipAddress,
  });

  return category;
}

// Features referencing this category have categoryId set to NULL by the
// DB itself (ON DELETE SET NULL) — no application-level block needed,
// unlike BodyType/CarModel where deletion is blocked outright.
export async function deleteFeatureCategory(id: number, actorId: number, ipAddress?: string | null) {
  const category = await getFeatureCategoryById(id);
  const affectedFeatureCount = await prisma.feature.count({ where: { categoryId: id } });

  await prisma.featureCategory.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted feature category "${category.name}" (id ${id})${
      affectedFeatureCount > 0 ? ` — ${affectedFeatureCount} feature(s) became uncategorized` : ''
    }`,
    ipAddress,
  });

  return { message: 'Feature category deleted successfully' };
}

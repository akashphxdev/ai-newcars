// src/modules/newCars/variantFeature/variantFeature.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type { ListVariantsWithFeaturesQueryParsed, SyncVariantFeaturesParsed } from './variantFeature.validation';
import type { FeatureCatalogGroup, VariantWithFeaturesRecord } from './variantFeature.types';

async function assertVariantExists(variantId: number) {
  const variant = await prisma.carVariant.findUnique({
    where: { id: variantId },
    select: { id: true, variantName: true },
  });
  if (!variant) {
    throw ApiError.badRequest('Invalid variantId — car variant does not exist');
  }
  return variant;
}

// Currently-assigned features for one variant — {featureId, value} pairs
// only; the admin panel merges this with the full catalog (below) to
// render checkbox state.
export async function getVariantFeatures(variantId: number) {
  await assertVariantExists(variantId);

  return prisma.variantFeature.findMany({
    where: { variantId },
    select: { featureId: true, value: true },
  });
}

// Listing for the Variant Features admin page — only variants that
// already have at least one feature assigned (relation-filter via
// `some: {}`), not every variant in the catalog. New variants only show
// up here once features have been assigned via the "Add Feature" flow.
export async function listVariantsWithFeatures(query: ListVariantsWithFeaturesQueryParsed) {
  const { page, limit, search } = query;

  const where: Prisma.CarVariantWhereInput = {
    features: { some: {} },
    ...(search
      ? {
          OR: [
            { variantName: { contains: search, mode: 'insensitive' } },
            { model: { name: { contains: search, mode: 'insensitive' } } },
            { model: { brand: { name: { contains: search, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.carVariant.findMany({
      where,
      select: {
        id: true,
        variantName: true,
        price: true,
        model: { select: { id: true, name: true, brand: { select: { id: true, name: true } } } },
        _count: { select: { features: true } },
      },
      orderBy: { variantName: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.carVariant.count({ where }),
  ]);

  const shaped: VariantWithFeaturesRecord[] = items.map((v) => ({
    id: v.id,
    variantName: v.variantName,
    price: v.price.toString(),
    model: v.model,
    featureCount: v._count.features,
  }));

  return {
    items: shaped,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

// Full feature catalog grouped by category — powers the assignment
// checklist regardless of what this particular variant already has.
export async function getFeatureCatalog(): Promise<FeatureCatalogGroup[]> {
  const features = await prisma.feature.findMany({
    select: {
      id: true,
      name: true,
      category: { select: { id: true, name: true, sortOrder: true } },
    },
    orderBy: { name: 'asc' },
  });

  const groups = new Map<string, FeatureCatalogGroup & { sortOrder: number }>();

  for (const f of features) {
    const key = f.category ? String(f.category.id) : 'uncategorized';
    if (!groups.has(key)) {
      groups.set(key, {
        categoryId: f.category?.id ?? null,
        categoryName: f.category?.name ?? 'Uncategorized',
        sortOrder: f.category?.sortOrder ?? Number.MAX_SAFE_INTEGER,
        features: [],
      });
    }
    groups.get(key)!.features.push({ id: f.id, name: f.name });
  }

  return Array.from(groups.values())
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ categoryId, categoryName, features: catFeatures }) => ({ categoryId, categoryName, features: catFeatures }));
}

// Replaces the full desired feature-set for a variant in one shot —
// standard "save this checklist" sync: add what's newly checked, remove
// what's been unchecked, update `value` on ones that were already there.
export async function syncVariantFeatures(
  variantId: number,
  input: SyncVariantFeaturesParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const variant = await assertVariantExists(variantId);

  const featureIds = input.features.map((f) => f.featureId);
  const uniqueFeatureIds = new Set(featureIds);
  if (uniqueFeatureIds.size !== featureIds.length) {
    throw ApiError.badRequest('Duplicate featureId in the request');
  }

  if (featureIds.length > 0) {
    const validCount = await prisma.feature.count({ where: { id: { in: featureIds } } });
    if (validCount !== uniqueFeatureIds.size) {
      throw ApiError.badRequest('One or more featureId values do not exist');
    }
  }

  await prisma.$transaction([
    prisma.variantFeature.deleteMany({ where: { variantId, featureId: { notIn: featureIds } } }),
    ...input.features.map((f) =>
      prisma.variantFeature.upsert({
        where: { variantId_featureId: { variantId, featureId: f.featureId } },
        update: { value: f.value ?? null },
        create: { variantId, featureId: f.featureId, value: f.value ?? null },
      }),
    ),
  ]);

  await createLog({
    adminId: actorId,
    description: `Updated features for variant "${variant.variantName}" (id ${variantId}) — ${input.features.length} feature(s) assigned`,
    ipAddress,
  });

  return { message: 'Variant features updated successfully' };
}

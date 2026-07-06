// src/modules/newCars/feature/feature.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type { FeatureListQueryParsed, CreateFeatureParsed, UpdateFeatureParsed } from './feature.validation';

const FEATURE_SELECT = {
  id: true,
  variantId: true,
  airbagsCount: true,
  absWithEbd: true,
  esc: true,
  hillAssist: true,
  rearParkingCamera: true,
  frontParkingSensors: true,
  tpms: true,
  isofixMounts: true,
  ncapRating: true,
  sunroof: true,
  keylessEntry: true,
  pushButtonStart: true,
  cruiseControl: true,
  climateControl: true,
  rearAcVents: true,
  autoDimmingMirror: true,
  powerWindows: true,
  upholsteryType: true,
  adjustableSeats: true,
  ventilatedSeats: true,
  rearArmrest: true,
  ledHeadlamps: true,
  ledDrls: true,
  alloyWheels: true,
  roofRails: true,
  fogLamps: true,
  touchscreenSizeInch: true,
  androidAuto: true,
  appleCarplay: true,
  connectedCarTech: true,
  numberOfSpeakers: true,
  wirelessCharging: true,
  extraFeatures: true,
  createdAt: true,
  variant: {
    select: {
      id: true,
      variantName: true,
      model: { select: { id: true, name: true, brand: { select: { id: true, name: true } } } },
    },
  },
} as const;

async function assertVariantExists(variantId: number) {
  const variant = await prisma.carVariant.findUnique({ where: { id: variantId }, select: { id: true } });
  if (!variant) {
    throw ApiError.badRequest('Invalid variantId — car variant does not exist');
  }
}

// A variant is expected to carry a single feature sheet — same "one
// spec-row per variant" idea enforced elsewhere via isDefault, except
// here there's nothing to default between, so we simply block a second
// row from being created for the same variant.
async function assertNoExistingFeatureForVariant(variantId: number, excludeId?: number) {
  const existing = await prisma.carFeature.findFirst({
    where: { variantId, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  if (existing) {
    throw ApiError.conflict('A feature sheet already exists for this variant — edit it instead');
  }
}

export async function listFeatures(query: FeatureListQueryParsed) {
  const { page, limit, variantId, sortBy, sortOrder } = query;

  const where: Prisma.CarFeatureWhereInput = {
    ...(variantId ? { variantId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.carFeature.findMany({
      where,
      select: FEATURE_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.carFeature.count({ where }),
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

export async function getFeatureById(id: number) {
  const feature = await prisma.carFeature.findUnique({
    where: { id },
    select: FEATURE_SELECT,
  });

  if (!feature) {
    throw ApiError.notFound('Feature sheet not found');
  }

  return feature;
}

export async function createFeature(input: CreateFeatureParsed, actorId: number) {
  await assertVariantExists(input.variantId);
  await assertNoExistingFeatureForVariant(input.variantId);

  const feature = await prisma.carFeature.create({
    data: input,
    select: FEATURE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created feature sheet (id ${feature.id}) for variant id ${feature.variantId}`,
  });

  return feature;
}

export async function updateFeature(id: number, input: UpdateFeatureParsed, actorId: number) {
  const existing = await getFeatureById(id);

  if (typeof input.variantId === 'number') {
    await assertVariantExists(input.variantId);
    await assertNoExistingFeatureForVariant(input.variantId, id);
  }

  const feature = await prisma.carFeature.update({
    where: { id },
    data: input,
    select: FEATURE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated feature sheet (id ${id}) for variant id ${existing.variantId} — fields: ${Object.keys(input).join(', ')}`,
  });

  return feature;
}

export async function deleteFeature(id: number, actorId: number) {
  const feature = await getFeatureById(id);

  await prisma.carFeature.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted feature sheet (id ${id}) for variant id ${feature.variantId}`,
  });

  return { message: 'Feature sheet deleted successfully' };
}
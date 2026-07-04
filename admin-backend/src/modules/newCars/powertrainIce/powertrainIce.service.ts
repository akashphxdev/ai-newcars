// src/modules/newCars/powertrainIce/powertrainIce.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type {
  PowertrainIceListQueryParsed,
  CreatePowertrainIceParsed,
  UpdatePowertrainIceParsed,
} from './powertrainIce.validation';
import type { PowertrainIceRecord } from './powertrainIce.types';

const POWERTRAIN_ICE_SELECT = {
  id: true,
  variantId: true,
  fuelType: true,
  fuelTypeSubCategory: true,
  fuelTankCapacity: true,
  cngTankCapacity: true,
  kerbWeight: true,
  engineDisplacement: true,
  cubicCapacity: true,
  cylinders: true,
  cylinderCapacity: true,
  transmissionType: true,
  transmissionSubType: true,
  transmissionSpeed: true,
  numGears: true,
  isFourByFour: true,
  drivetrain: true,
  powerPs: true,
  powerMinRpm: true,
  powerMaxRpm: true,
  powerWeight: true,
  torqueNm: true,
  torqueMinRpm: true,
  torqueMaxRpm: true,
  torqueWeight: true,
  claimedFe: true,
  realWorldMileage: true,
  cityMileage: true,
  highwayMileage: true,
  topSpeedKmph: true,
  topSpeedTimeSec: true,
  realWorldUrl: true,
  cityUrl: true,
  highwayUrl: true,
  isDefault: true,
  isDeleted: true,
  deletedBy: true,
  deletedAt: true,
  expiresAt: true,
  createdAt: true,
  variant: {
    select: {
      id: true,
      variantName: true,
      model: {
        select: {
          id: true,
          name: true,
          brand: { select: { id: true, name: true } },
        },
      },
    },
  },
} as const;

export async function listPowertrainIce(query: PowertrainIceListQueryParsed) {
  const { page, limit, variantId, fuelType, isDefault, includeDeleted, sortBy, sortOrder } = query;

  const where: Prisma.CarPowertrainIceWhereInput = {
    ...(includeDeleted ? {} : { isDeleted: false }),
    ...(variantId ? { variantId } : {}),
    ...(fuelType ? { fuelType } : {}),
    ...(typeof isDefault === 'boolean' ? { isDefault } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.carPowertrainIce.findMany({
      where,
      select: POWERTRAIN_ICE_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.carPowertrainIce.count({ where }),
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

export async function getPowertrainIceById(id: number): Promise<PowertrainIceRecord> {
  const powertrain = await prisma.carPowertrainIce.findUnique({
    where: { id },
    select: POWERTRAIN_ICE_SELECT,
  });

  if (!powertrain) {
    throw ApiError.notFound('ICE powertrain not found');
  }

  return powertrain as unknown as PowertrainIceRecord;
}

// Every powertrain row must belong to a real, existing variant — same
// "validate the parent foreign key" rule as variant.service.ts's
// assertModelExists.
async function assertVariantExists(variantId: number) {
  const variant = await prisma.carVariant.findUnique({ where: { id: variantId }, select: { id: true } });
  if (!variant) {
    throw ApiError.badRequest('Invalid variantId — car variant does not exist');
  }
}

// Only one ICE powertrain per variant may be marked "default" (used to
// decide which spec sheet shows on the public model page by default).
// Runs inside the caller's transaction so the un-default + set-default
// happen atomically.
async function unsetOtherDefaults(
  tx: Prisma.TransactionClient,
  variantId: number,
  excludeId?: number,
) {
  await tx.carPowertrainIce.updateMany({
    where: {
      variantId,
      isDefault: true,
      isDeleted: false,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    data: { isDefault: false },
  });
}

export async function createPowertrainIce(input: CreatePowertrainIceParsed, actorId: number) {
  await assertVariantExists(input.variantId);

  const powertrain = await prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await unsetOtherDefaults(tx, input.variantId);
    }

    return tx.carPowertrainIce.create({
      data: {
        variantId: input.variantId,
        fuelType: input.fuelType,
        fuelTypeSubCategory: input.fuelTypeSubCategory,
        fuelTankCapacity: input.fuelTankCapacity,
        cngTankCapacity: input.cngTankCapacity,
        kerbWeight: input.kerbWeight,
        engineDisplacement: input.engineDisplacement,
        cubicCapacity: input.cubicCapacity,
        cylinders: input.cylinders,
        cylinderCapacity: input.cylinderCapacity,
        transmissionType: input.transmissionType,
        transmissionSubType: input.transmissionSubType,
        transmissionSpeed: input.transmissionSpeed,
        numGears: input.numGears,
        isFourByFour: input.isFourByFour,
        drivetrain: input.drivetrain,
        powerPs: input.powerPs,
        powerMinRpm: input.powerMinRpm,
        powerMaxRpm: input.powerMaxRpm,
        powerWeight: input.powerWeight,
        torqueNm: input.torqueNm,
        torqueMinRpm: input.torqueMinRpm,
        torqueMaxRpm: input.torqueMaxRpm,
        torqueWeight: input.torqueWeight,
        claimedFe: input.claimedFe,
        realWorldMileage: input.realWorldMileage,
        cityMileage: input.cityMileage,
        highwayMileage: input.highwayMileage,
        topSpeedKmph: input.topSpeedKmph,
        topSpeedTimeSec: input.topSpeedTimeSec,
        realWorldUrl: input.realWorldUrl,
        cityUrl: input.cityUrl,
        highwayUrl: input.highwayUrl,
        isDefault: input.isDefault,
      },
      select: POWERTRAIN_ICE_SELECT,
    });
  });

  await createLog({
    adminId: actorId,
    description: `Created ICE powertrain (id ${powertrain.id}, fuel "${powertrain.fuelType}") under variant id ${powertrain.variantId}`,
  });

  return powertrain;
}

export async function updatePowertrainIce(
  id: number,
  input: UpdatePowertrainIceParsed,
  actorId: number,
) {
  const existing = await getPowertrainIceById(id);

  if (typeof input.variantId === 'number') {
    await assertVariantExists(input.variantId);
  }

  const targetVariantId = input.variantId ?? existing.variantId;

  const powertrain = await prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await unsetOtherDefaults(tx, targetVariantId, id);
    }

    return tx.carPowertrainIce.update({
      where: { id },
      data: {
        ...input,
        // Nullable spec fields need `null` passed through as-is when the
        // caller explicitly clears them — same reasoning as CarModel's
        // bodyType/priceMin handling.
        fuelTypeSubCategory: input.fuelTypeSubCategory,
        fuelTankCapacity: input.fuelTankCapacity,
        cngTankCapacity: input.cngTankCapacity,
        kerbWeight: input.kerbWeight,
        engineDisplacement: input.engineDisplacement,
        cubicCapacity: input.cubicCapacity,
        cylinders: input.cylinders,
        cylinderCapacity: input.cylinderCapacity,
        transmissionType: input.transmissionType,
        transmissionSubType: input.transmissionSubType,
        transmissionSpeed: input.transmissionSpeed,
        numGears: input.numGears,
        drivetrain: input.drivetrain,
        powerPs: input.powerPs,
        powerMinRpm: input.powerMinRpm,
        powerMaxRpm: input.powerMaxRpm,
        powerWeight: input.powerWeight,
        torqueNm: input.torqueNm,
        torqueMinRpm: input.torqueMinRpm,
        torqueMaxRpm: input.torqueMaxRpm,
        torqueWeight: input.torqueWeight,
        claimedFe: input.claimedFe,
        realWorldMileage: input.realWorldMileage,
        cityMileage: input.cityMileage,
        highwayMileage: input.highwayMileage,
        topSpeedKmph: input.topSpeedKmph,
        topSpeedTimeSec: input.topSpeedTimeSec,
        realWorldUrl: input.realWorldUrl,
        cityUrl: input.cityUrl,
        highwayUrl: input.highwayUrl,
      },
      select: POWERTRAIN_ICE_SELECT,
    });
  });

  await createLog({
    adminId: actorId,
    description: `Updated ICE powertrain (id ${id}) — fields: ${Object.keys(input).join(', ')}`,
  });

  return powertrain;
}

// Soft delete — matches the isDeleted/deletedBy/deletedAt columns baked
// into car_powertrains_ice. The row stays in the DB for audit/recovery;
// it's just excluded from the default list view (see listPowertrainIce).
export async function deletePowertrainIce(id: number, actorId: number) {
  const powertrain = await getPowertrainIceById(id);

  if (powertrain.isDeleted) {
    throw ApiError.badRequest('This ICE powertrain is already deleted');
  }

  await prisma.carPowertrainIce.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedBy: actorId,
      deletedAt: new Date(),
      // A soft-deleted row should never remain the "default" spec shown
      // publicly for its variant.
      isDefault: false,
    },
  });

  await createLog({
    adminId: actorId,
    description: `Deleted ICE powertrain (id ${id}) under variant id ${powertrain.variantId}`,
  });

  return { message: 'ICE powertrain deleted successfully' };
}

// Restore a soft-deleted row — the counterpart quick action to delete,
// same "lightweight status flip" pattern as
// carModel.service.ts's updateCarModelLaunchStatus.
export async function restorePowertrainIce(id: number, actorId: number) {
  const powertrain = await getPowertrainIceById(id);

  if (!powertrain.isDeleted) {
    throw ApiError.badRequest('This ICE powertrain is not deleted');
  }

  await prisma.carPowertrainIce.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedBy: null,
      deletedAt: null,
    },
  });

  await createLog({
    adminId: actorId,
    description: `Restored ICE powertrain (id ${id}) under variant id ${powertrain.variantId}`,
  });

  return { message: 'ICE powertrain restored successfully' };
}
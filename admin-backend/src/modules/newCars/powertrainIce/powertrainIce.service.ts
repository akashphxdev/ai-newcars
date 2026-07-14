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
import type { PowertrainIceRecord, PowertrainIceListItem } from './powertrainIce.types';

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
  transmissionTypeId: true,
  transmissionType: { select: { id: true, name: true, slug: true } },
  transmissionSubType: true,
  transmissionSpeed: true,
  numGears: true,
  isFourByFour: true,
  drivetrainId: true,
  drivetrain: { select: { id: true, name: true, slug: true } },
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

// Listing only ships what the table actually renders — full spec sheet is
// fetched separately via getById when a row is expanded on the frontend.
const POWERTRAIN_ICE_LIST_SELECT = {
  id: true,
  variantId: true,
  fuelType: true,
  fuelTypeSubCategory: true,
  engineDisplacement: true,
  powerPs: true,
  torqueNm: true,
  transmissionType: { select: { id: true, name: true, slug: true } },
  isDefault: true,
  isDeleted: true,
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

export async function listPowertrainIce(query: PowertrainIceListQueryParsed): Promise<{
  items: PowertrainIceListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
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
      select: POWERTRAIN_ICE_LIST_SELECT,
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

async function assertVariantExists(variantId: number) {
  const variant = await prisma.carVariant.findUnique({ where: { id: variantId }, select: { id: true } });
  if (!variant) {
    throw ApiError.badRequest('Invalid variantId — car variant does not exist');
  }
}

async function assertAttributeOptionExists(id: number, category: string, label: string) {
  const option = await prisma.attributeOption.findFirst({
    where: { id, category },
    select: { id: true },
  });
  if (!option) {
    throw ApiError.badRequest(`Invalid ${label}Id — option does not exist`);
  }
}

// ICE powertrains have no name of their own — every log line identifies
// one by the "Brand Model — Variant" it's attached to instead.
function describePowertrainSubject(powertrain: {
  variant: { variantName: string; model: { name: string; brand: { name: string } } };
}): string {
  return `${powertrain.variant.model.brand.name} ${powertrain.variant.model.name} — ${powertrain.variant.variantName}`;
}

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
  if (typeof input.transmissionTypeId === 'number') {
    await assertAttributeOptionExists(input.transmissionTypeId, 'transmission', 'transmissionType');
  }
  if (typeof input.drivetrainId === 'number') {
    await assertAttributeOptionExists(input.drivetrainId, 'drivetrain', 'drivetrain');
  }

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
        transmissionTypeId: input.transmissionTypeId,
        transmissionSubType: input.transmissionSubType,
        transmissionSpeed: input.transmissionSpeed,
        numGears: input.numGears,
        isFourByFour: input.isFourByFour,
        drivetrainId: input.drivetrainId,
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
    description: `Created ICE powertrain for "${describePowertrainSubject(powertrain)}" (id ${powertrain.id})`,
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
  if (typeof input.transmissionTypeId === 'number') {
    await assertAttributeOptionExists(input.transmissionTypeId, 'transmission', 'transmissionType');
  }
  if (typeof input.drivetrainId === 'number') {
    await assertAttributeOptionExists(input.drivetrainId, 'drivetrain', 'drivetrain');
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
        fuelTypeSubCategory: input.fuelTypeSubCategory,
        fuelTankCapacity: input.fuelTankCapacity,
        cngTankCapacity: input.cngTankCapacity,
        kerbWeight: input.kerbWeight,
        engineDisplacement: input.engineDisplacement,
        cubicCapacity: input.cubicCapacity,
        cylinders: input.cylinders,
        cylinderCapacity: input.cylinderCapacity,
        transmissionTypeId: input.transmissionTypeId,
        transmissionSubType: input.transmissionSubType,
        transmissionSpeed: input.transmissionSpeed,
        numGears: input.numGears,
        drivetrainId: input.drivetrainId,
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
    description: `Updated ICE powertrain for "${describePowertrainSubject(powertrain)}" (id ${id})`,
  });

  return powertrain;
}

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
      isDefault: false,
    },
  });

  await createLog({
    adminId: actorId,
    description: `Deleted ICE powertrain for "${describePowertrainSubject(powertrain)}" (id ${id})`,
  });

  return { message: 'ICE powertrain deleted successfully' };
}

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
    description: `Restored ICE powertrain for "${describePowertrainSubject(powertrain)}" (id ${id})`,
  });

  return { message: 'ICE powertrain restored successfully' };
}
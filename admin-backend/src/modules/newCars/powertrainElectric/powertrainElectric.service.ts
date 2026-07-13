// src/modules/newCars/powertrainElectric/powertrainElectric.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type {
  PowertrainElectricListQueryParsed,
  CreatePowertrainElectricParsed,
  UpdatePowertrainElectricParsed,
} from './powertrainElectric.validation';
import type { PowertrainElectricRecord, PowertrainElectricListItem } from './powertrainElectric.types';

const POWERTRAIN_ELECTRIC_SELECT = {
  id: true,
  variantId: true,
  numMotors: true,
  motorType: true,
  batteryCapacity: true,
  batteryChemistry: true,
  thermalManagementSystem: true,
  drivetrainId: true,
  drivetrain: { select: { id: true, name: true, slug: true } },
  powerPs: true,
  torqueNm: true,
  claimedRange: true,
  realWorldRange: true,
  testCycleType: true,
  topSpeedKmph: true,
  topSpeedTimeSec: true,
  acChargingOutput: true,
  acChargingTime: true,
  chargerSizeAc3kwHours: true,
  chargerSizeAc7kwHours: true,
  chargerSizeAc11kwHours: true,
  chargerSizeAc22kwHours: true,
  dcChargingOutput: true,
  dcFastChargingTime: true,
  powertrainBootspace: true,
  batteryWarrantyKm: true,
  batteryWarrantyYears: true,
  motorWarrantyKm: true,
  motorWarrantyYears: true,
  standardWarrantyKm: true,
  standardWarrantyYears: true,
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
const POWERTRAIN_ELECTRIC_LIST_SELECT = {
  id: true,
  variantId: true,
  batteryCapacity: true,
  drivetrain: { select: { id: true, name: true, slug: true } },
  powerPs: true,
  torqueNm: true,
  claimedRange: true,
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

export async function listPowertrainElectric(query: PowertrainElectricListQueryParsed): Promise<{
  items: PowertrainElectricListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const { page, limit, variantId, isDefault, includeDeleted, sortBy, sortOrder } = query;

  const where: Prisma.CarPowertrainElectricWhereInput = {
    ...(includeDeleted ? {} : { isDeleted: false }),
    ...(variantId ? { variantId } : {}),
    ...(typeof isDefault === 'boolean' ? { isDefault } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.carPowertrainElectric.findMany({
      where,
      select: POWERTRAIN_ELECTRIC_LIST_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.carPowertrainElectric.count({ where }),
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

export async function getPowertrainElectricById(id: number): Promise<PowertrainElectricRecord> {
  const powertrain = await prisma.carPowertrainElectric.findUnique({
    where: { id },
    select: POWERTRAIN_ELECTRIC_SELECT,
  });

  if (!powertrain) {
    throw ApiError.notFound('Electric powertrain not found');
  }

  return powertrain as unknown as PowertrainElectricRecord;
}

async function assertVariantExists(variantId: number) {
  const variant = await prisma.carVariant.findUnique({ where: { id: variantId }, select: { id: true } });
  if (!variant) {
    throw ApiError.badRequest('Invalid variantId — car variant does not exist');
  }
}

async function assertDrivetrainExists(drivetrainId: number) {
  const option = await prisma.attributeOption.findFirst({
    where: { id: drivetrainId, category: 'drivetrain' },
    select: { id: true },
  });
  if (!option) {
    throw ApiError.badRequest('Invalid drivetrainId — option does not exist');
  }
}

async function unsetOtherDefaults(
  tx: Prisma.TransactionClient,
  variantId: number,
  excludeId?: number,
) {
  await tx.carPowertrainElectric.updateMany({
    where: {
      variantId,
      isDefault: true,
      isDeleted: false,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    data: { isDefault: false },
  });
}

export async function createPowertrainElectric(
  input: CreatePowertrainElectricParsed,
  actorId: number,
) {
  await assertVariantExists(input.variantId);
  if (typeof input.drivetrainId === 'number') {
    await assertDrivetrainExists(input.drivetrainId);
  }

  const powertrain = await prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await unsetOtherDefaults(tx, input.variantId);
    }

    return tx.carPowertrainElectric.create({
      data: {
        variantId: input.variantId,
        numMotors: input.numMotors,
        motorType: input.motorType,
        batteryCapacity: input.batteryCapacity,
        batteryChemistry: input.batteryChemistry,
        thermalManagementSystem: input.thermalManagementSystem,
        drivetrainId: input.drivetrainId,
        powerPs: input.powerPs,
        torqueNm: input.torqueNm,
        claimedRange: input.claimedRange,
        realWorldRange: input.realWorldRange,
        testCycleType: input.testCycleType,
        topSpeedKmph: input.topSpeedKmph,
        topSpeedTimeSec: input.topSpeedTimeSec,
        acChargingOutput: input.acChargingOutput,
        acChargingTime: input.acChargingTime,
        chargerSizeAc3kwHours: input.chargerSizeAc3kwHours,
        chargerSizeAc7kwHours: input.chargerSizeAc7kwHours,
        chargerSizeAc11kwHours: input.chargerSizeAc11kwHours,
        chargerSizeAc22kwHours: input.chargerSizeAc22kwHours,
        dcChargingOutput: input.dcChargingOutput,
        dcFastChargingTime: input.dcFastChargingTime,
        powertrainBootspace: input.powertrainBootspace,
        batteryWarrantyKm: input.batteryWarrantyKm,
        batteryWarrantyYears: input.batteryWarrantyYears,
        motorWarrantyKm: input.motorWarrantyKm,
        motorWarrantyYears: input.motorWarrantyYears,
        standardWarrantyKm: input.standardWarrantyKm,
        standardWarrantyYears: input.standardWarrantyYears,
        realWorldUrl: input.realWorldUrl,
        cityUrl: input.cityUrl,
        highwayUrl: input.highwayUrl,
        isDefault: input.isDefault,
      },
      select: POWERTRAIN_ELECTRIC_SELECT,
    });
  });

  await createLog({
    adminId: actorId,
    description: `Created Electric powertrain (id ${powertrain.id}) under variant id ${powertrain.variantId}`,
  });

  return powertrain;
}

export async function updatePowertrainElectric(
  id: number,
  input: UpdatePowertrainElectricParsed,
  actorId: number,
) {
  const existing = await getPowertrainElectricById(id);

  if (typeof input.variantId === 'number') {
    await assertVariantExists(input.variantId);
  }
  if (typeof input.drivetrainId === 'number') {
    await assertDrivetrainExists(input.drivetrainId);
  }

  const targetVariantId = input.variantId ?? existing.variantId;

  const powertrain = await prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await unsetOtherDefaults(tx, targetVariantId, id);
    }

    return tx.carPowertrainElectric.update({
      where: { id },
      data: {
        ...input,
        numMotors: input.numMotors,
        motorType: input.motorType,
        batteryCapacity: input.batteryCapacity,
        batteryChemistry: input.batteryChemistry,
        thermalManagementSystem: input.thermalManagementSystem,
        drivetrainId: input.drivetrainId,
        powerPs: input.powerPs,
        torqueNm: input.torqueNm,
        claimedRange: input.claimedRange,
        realWorldRange: input.realWorldRange,
        testCycleType: input.testCycleType,
        topSpeedKmph: input.topSpeedKmph,
        topSpeedTimeSec: input.topSpeedTimeSec,
        acChargingOutput: input.acChargingOutput,
        acChargingTime: input.acChargingTime,
        chargerSizeAc3kwHours: input.chargerSizeAc3kwHours,
        chargerSizeAc7kwHours: input.chargerSizeAc7kwHours,
        chargerSizeAc11kwHours: input.chargerSizeAc11kwHours,
        chargerSizeAc22kwHours: input.chargerSizeAc22kwHours,
        dcChargingOutput: input.dcChargingOutput,
        dcFastChargingTime: input.dcFastChargingTime,
        powertrainBootspace: input.powertrainBootspace,
        batteryWarrantyKm: input.batteryWarrantyKm,
        batteryWarrantyYears: input.batteryWarrantyYears,
        motorWarrantyKm: input.motorWarrantyKm,
        motorWarrantyYears: input.motorWarrantyYears,
        standardWarrantyKm: input.standardWarrantyKm,
        standardWarrantyYears: input.standardWarrantyYears,
        realWorldUrl: input.realWorldUrl,
        cityUrl: input.cityUrl,
        highwayUrl: input.highwayUrl,
      },
      select: POWERTRAIN_ELECTRIC_SELECT,
    });
  });

  await createLog({
    adminId: actorId,
    description: `Updated Electric powertrain (id ${id}) — fields: ${Object.keys(input).join(', ')}`,
  });

  return powertrain;
}

export async function deletePowertrainElectric(id: number, actorId: number) {
  const powertrain = await getPowertrainElectricById(id);

  if (powertrain.isDeleted) {
    throw ApiError.badRequest('This Electric powertrain is already deleted');
  }

  await prisma.carPowertrainElectric.update({
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
    description: `Deleted Electric powertrain (id ${id}) under variant id ${powertrain.variantId}`,
  });

  return { message: 'Electric powertrain deleted successfully' };
}

export async function restorePowertrainElectric(id: number, actorId: number) {
  const powertrain = await getPowertrainElectricById(id);

  if (!powertrain.isDeleted) {
    throw ApiError.badRequest('This Electric powertrain is not deleted');
  }

  await prisma.carPowertrainElectric.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedBy: null,
      deletedAt: null,
    },
  });

  await createLog({
    adminId: actorId,
    description: `Restored Electric powertrain (id ${id}) under variant id ${powertrain.variantId}`,
  });

  return { message: 'Electric powertrain restored successfully' };
}
// src/modules/newCars/powertrainIce/powertrainIce.validation.ts

import { z } from 'zod';

// Numeric codes only — labels live on the frontend
// (front/src/lib/lookups.ts's FUEL_TYPE_OPTIONS). Backend just needs to
// know which codes are currently valid. Same pattern as offer.validation.ts's
// OFFER_TYPE_CODES.
//   1 = Petrol, 2 = Diesel, 3 = CNG, 4 = LPG, 5 = Hybrid
export const FUEL_TYPE_CODES = [1, 2, 3, 4, 5] as const;

export const powertrainIceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  variantId: z.coerce.number().int().positive().optional(),
  fuelType: z.coerce
    .number()
    .int()
    .refine((v) => (FUEL_TYPE_CODES as readonly number[]).includes(v), 'Invalid fuelType code')
    .optional(),
  isDefault: z.coerce.boolean().optional(),
  includeDeleted: z.coerce.boolean().default(false),
  sortBy: z.enum(['id', 'createdAt', 'powerPs', 'claimedFe']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const powertrainIceIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const powertrainIceCreateShape = {
  variantId: z.coerce.number().int().positive('variantId is required'),
  fuelType: z.coerce
    .number({ required_error: 'Fuel type is required', invalid_type_error: 'Fuel type is required' })
    .int()
    .refine((v) => (FUEL_TYPE_CODES as readonly number[]).includes(v), 'Invalid fuelType code'),
  fuelTypeSubCategory: z.string().trim().max(30).optional(),
  fuelTankCapacity: z.coerce.number().nonnegative().optional(),
  cngTankCapacity: z.coerce.number().nonnegative().optional(),
  // Core spec fields — required so a powertrain row can't be saved
  // half-empty. Everything else here stays optional (varies by source /
  // may not be published yet).
  kerbWeight: z.coerce.number().int().nonnegative('Kerb weight is required'),
  engineDisplacement: z.coerce.number().nonnegative('Engine displacement is required'),
  cubicCapacity: z.coerce.number().int().nonnegative().optional(),
  cylinders: z.coerce.number().int().positive('Cylinders is required'),
  cylinderCapacity: z.coerce.number().nonnegative().optional(),
  transmissionTypeId: z.coerce.number().int().positive('Transmission type is required'),
  transmissionSubType: z.string().trim().max(20).optional(),
  transmissionSpeed: z.coerce.number().int().nonnegative().optional(),
  numGears: z.coerce.number().int().nonnegative().optional(),
  isFourByFour: z.boolean().default(false),
  drivetrainId: z.coerce.number().int().positive().optional(),
  powerPs: z.coerce.number().int().positive('Power (PS) is required'),
  powerMinRpm: z.coerce.number().int().nonnegative().optional(),
  powerMaxRpm: z.coerce.number().int().nonnegative().optional(),
  powerWeight: z.coerce.number().nonnegative().optional(),
  torqueNm: z.coerce.number().int().positive('Torque (Nm) is required'),
  torqueMinRpm: z.coerce.number().int().nonnegative().optional(),
  torqueMaxRpm: z.coerce.number().int().nonnegative().optional(),
  torqueWeight: z.coerce.number().nonnegative().optional(),
  claimedFe: z.coerce.number().nonnegative().optional(),
  realWorldMileage: z.coerce.number().nonnegative().optional(),
  cityMileage: z.coerce.number().nonnegative().optional(),
  highwayMileage: z.coerce.number().nonnegative().optional(),
  topSpeedKmph: z.coerce.number().int().nonnegative().optional(),
  topSpeedTimeSec: z.coerce.number().nonnegative().optional(),
  realWorldUrl: z.string().trim().url('Must be a valid URL').max(255).optional(),
  cityUrl: z.string().trim().url('Must be a valid URL').max(255).optional(),
  highwayUrl: z.string().trim().url('Must be a valid URL').max(255).optional(),
  isDefault: z.boolean().default(false),
};

export const createPowertrainIceSchema = z.object(powertrainIceCreateShape);

export const updatePowertrainIceSchema = z
  .object({
    variantId: z.coerce.number().int().positive().optional(),
    fuelType: z.coerce
      .number()
      .int()
      .refine((v) => (FUEL_TYPE_CODES as readonly number[]).includes(v), 'Invalid fuelType code')
      .optional(),
    fuelTypeSubCategory: z.string().trim().max(30).nullable().optional(),
    fuelTankCapacity: z.coerce.number().nonnegative().nullable().optional(),
    cngTankCapacity: z.coerce.number().nonnegative().nullable().optional(),
    // Same core-required fields as create — .nullable() removed so an
    // update can't null these back out, but still .optional() so a PATCH
    // that doesn't touch them is fine.
    kerbWeight: z.coerce.number().int().nonnegative('Kerb weight is required').optional(),
    engineDisplacement: z.coerce.number().nonnegative('Engine displacement is required').optional(),
    cubicCapacity: z.coerce.number().int().nonnegative().nullable().optional(),
    cylinders: z.coerce.number().int().positive('Cylinders is required').optional(),
    cylinderCapacity: z.coerce.number().nonnegative().nullable().optional(),
    transmissionTypeId: z.coerce.number().int().positive('Transmission type is required').optional(),
    transmissionSubType: z.string().trim().max(20).nullable().optional(),
    transmissionSpeed: z.coerce.number().int().nonnegative().nullable().optional(),
    numGears: z.coerce.number().int().nonnegative().nullable().optional(),
    isFourByFour: z.boolean().optional(),
    drivetrainId: z.coerce.number().int().positive().nullable().optional(),
    powerPs: z.coerce.number().int().positive('Power (PS) is required').optional(),
    powerMinRpm: z.coerce.number().int().nonnegative().nullable().optional(),
    powerMaxRpm: z.coerce.number().int().nonnegative().nullable().optional(),
    powerWeight: z.coerce.number().nonnegative().nullable().optional(),
    torqueNm: z.coerce.number().int().positive('Torque (Nm) is required').optional(),
    torqueMinRpm: z.coerce.number().int().nonnegative().nullable().optional(),
    torqueMaxRpm: z.coerce.number().int().nonnegative().nullable().optional(),
    torqueWeight: z.coerce.number().nonnegative().nullable().optional(),
    claimedFe: z.coerce.number().nonnegative().nullable().optional(),
    realWorldMileage: z.coerce.number().nonnegative().nullable().optional(),
    cityMileage: z.coerce.number().nonnegative().nullable().optional(),
    highwayMileage: z.coerce.number().nonnegative().nullable().optional(),
    topSpeedKmph: z.coerce.number().int().nonnegative().nullable().optional(),
    topSpeedTimeSec: z.coerce.number().nonnegative().nullable().optional(),
    realWorldUrl: z.string().trim().url().max(255).nullable().optional(),
    cityUrl: z.string().trim().url().max(255).nullable().optional(),
    highwayUrl: z.string().trim().url().max(255).nullable().optional(),
    isDefault: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export type PowertrainIceListQueryParsed = z.infer<typeof powertrainIceListQuerySchema>;
export type CreatePowertrainIceParsed = z.infer<typeof createPowertrainIceSchema>;
export type UpdatePowertrainIceParsed = z.infer<typeof updatePowertrainIceSchema>;
export type FuelType = (typeof FUEL_TYPE_CODES)[number];
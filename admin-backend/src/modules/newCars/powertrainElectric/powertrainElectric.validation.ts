// src/modules/newCars/powertrainElectric/powertrainElectric.validation.ts

import { z } from 'zod';

const DRIVETRAINS = ['FWD', 'RWD', 'AWD', '4WD'] as const;
const TEST_CYCLE_TYPES = ['ARAI', 'WLTP', 'EPA', 'NEDC'] as const;

export const powertrainElectricListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  variantId: z.coerce.number().int().positive().optional(),
  isDefault: z.coerce.boolean().optional(),
  // Same "hide soft-deleted rows by default" convention as
  // powertrainIce.validation.ts.
  includeDeleted: z.coerce.boolean().default(false),
  sortBy: z.enum(['id', 'createdAt', 'claimedRange', 'powerPs']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const powertrainElectricIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Only variantId is mandatory — every EV spec field is filled in
// progressively by the content team, same reasoning as
// powertrainIce.validation.ts's create schema.
const powertrainElectricCreateShape = {
  variantId: z.coerce.number().int().positive('variantId is required'),
  numMotors: z.coerce.number().int().nonnegative().optional(),
  motorType: z.string().trim().max(50).optional(),
  batteryCapacity: z.coerce.number().nonnegative().optional(),
  batteryChemistry: z.string().trim().max(30).optional(),
  thermalManagementSystem: z.string().trim().max(50).optional(),
  drivetrain: z.enum(DRIVETRAINS).optional(),
  powerPs: z.coerce.number().int().nonnegative().optional(),
  torqueNm: z.coerce.number().int().nonnegative().optional(),
  claimedRange: z.coerce.number().int().nonnegative().optional(),
  realWorldRange: z.coerce.number().int().nonnegative().optional(),
  testCycleType: z.enum(TEST_CYCLE_TYPES).optional(),
  topSpeedKmph: z.coerce.number().int().nonnegative().optional(),
  topSpeedTimeSec: z.coerce.number().nonnegative().optional(),
  acChargingOutput: z.coerce.number().nonnegative().optional(),
  acChargingTime: z.coerce.number().nonnegative().optional(),
  chargerSizeAc3kwHours: z.coerce.number().int().nonnegative().optional(),
  chargerSizeAc7kwHours: z.coerce.number().int().nonnegative().optional(),
  chargerSizeAc11kwHours: z.coerce.number().int().nonnegative().optional(),
  chargerSizeAc22kwHours: z.coerce.number().int().nonnegative().optional(),
  dcChargingOutput: z.coerce.number().nonnegative().optional(),
  // Free text on purpose (schema stores this as VarChar, not a number) —
  // e.g. "10-80% in 30 min", which doesn't fit a single numeric field.
  dcFastChargingTime: z.string().trim().max(50).optional(),
  powertrainBootspace: z.coerce.number().int().nonnegative().optional(),
  batteryWarrantyKm: z.coerce.number().int().nonnegative().optional(),
  batteryWarrantyYears: z.coerce.number().int().nonnegative().optional(),
  motorWarrantyKm: z.coerce.number().int().nonnegative().optional(),
  motorWarrantyYears: z.coerce.number().int().nonnegative().optional(),
  // Also free text in the schema (e.g. "Unlimited") rather than a plain
  // number — same reasoning as dcFastChargingTime.
  standardWarrantyKm: z.string().trim().max(20).optional(),
  standardWarrantyYears: z.coerce.number().int().nonnegative().optional(),
  realWorldUrl: z.string().trim().url('Must be a valid URL').max(255).optional(),
  cityUrl: z.string().trim().url('Must be a valid URL').max(255).optional(),
  highwayUrl: z.string().trim().url('Must be a valid URL').max(255).optional(),
  // Only one EV powertrain per variant can be "default" — enforced in
  // the service layer, same rule as powertrainIce.validation.ts.
  isDefault: z.boolean().default(false),
};

export const createPowertrainElectricSchema = z.object(powertrainElectricCreateShape);

// Partial PATCH — same convention as Brand/CarModel and
// powertrainIce.validation.ts's update schema. Nullable fields accept an
// explicit `null` to clear a previously-set value.
export const updatePowertrainElectricSchema = z
  .object({
    variantId: z.coerce.number().int().positive().optional(),
    numMotors: z.coerce.number().int().nonnegative().nullable().optional(),
    motorType: z.string().trim().max(50).nullable().optional(),
    batteryCapacity: z.coerce.number().nonnegative().nullable().optional(),
    batteryChemistry: z.string().trim().max(30).nullable().optional(),
    thermalManagementSystem: z.string().trim().max(50).nullable().optional(),
    drivetrain: z.enum(DRIVETRAINS).nullable().optional(),
    powerPs: z.coerce.number().int().nonnegative().nullable().optional(),
    torqueNm: z.coerce.number().int().nonnegative().nullable().optional(),
    claimedRange: z.coerce.number().int().nonnegative().nullable().optional(),
    realWorldRange: z.coerce.number().int().nonnegative().nullable().optional(),
    testCycleType: z.enum(TEST_CYCLE_TYPES).nullable().optional(),
    topSpeedKmph: z.coerce.number().int().nonnegative().nullable().optional(),
    topSpeedTimeSec: z.coerce.number().nonnegative().nullable().optional(),
    acChargingOutput: z.coerce.number().nonnegative().nullable().optional(),
    acChargingTime: z.coerce.number().nonnegative().nullable().optional(),
    chargerSizeAc3kwHours: z.coerce.number().int().nonnegative().nullable().optional(),
    chargerSizeAc7kwHours: z.coerce.number().int().nonnegative().nullable().optional(),
    chargerSizeAc11kwHours: z.coerce.number().int().nonnegative().nullable().optional(),
    chargerSizeAc22kwHours: z.coerce.number().int().nonnegative().nullable().optional(),
    dcChargingOutput: z.coerce.number().nonnegative().nullable().optional(),
    dcFastChargingTime: z.string().trim().max(50).nullable().optional(),
    powertrainBootspace: z.coerce.number().int().nonnegative().nullable().optional(),
    batteryWarrantyKm: z.coerce.number().int().nonnegative().nullable().optional(),
    batteryWarrantyYears: z.coerce.number().int().nonnegative().nullable().optional(),
    motorWarrantyKm: z.coerce.number().int().nonnegative().nullable().optional(),
    motorWarrantyYears: z.coerce.number().int().nonnegative().nullable().optional(),
    standardWarrantyKm: z.string().trim().max(20).nullable().optional(),
    standardWarrantyYears: z.coerce.number().int().nonnegative().nullable().optional(),
    realWorldUrl: z.string().trim().url().max(255).nullable().optional(),
    cityUrl: z.string().trim().url().max(255).nullable().optional(),
    highwayUrl: z.string().trim().url().max(255).nullable().optional(),
    isDefault: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export type PowertrainElectricListQueryParsed = z.infer<typeof powertrainElectricListQuerySchema>;
export type CreatePowertrainElectricParsed = z.infer<typeof createPowertrainElectricSchema>;
export type UpdatePowertrainElectricParsed = z.infer<typeof updatePowertrainElectricSchema>;
export type TestCycleType = (typeof TEST_CYCLE_TYPES)[number];
export type ElectricDrivetrain = (typeof DRIVETRAINS)[number];
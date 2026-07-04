// src/modules/newCars/powertrainIce/powertrainIce.validation.ts

import { z } from 'zod';

const FUEL_TYPES = ['petrol', 'diesel', 'cng', 'lpg', 'hybrid'] as const;
const TRANSMISSION_TYPES = ['manual', 'automatic', 'amt', 'cvt', 'dct'] as const;
const DRIVETRAINS = ['FWD', 'RWD', 'AWD', '4WD'] as const;

export const powertrainIceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  variantId: z.coerce.number().int().positive().optional(),
  fuelType: z.enum(FUEL_TYPES).optional(),
  isDefault: z.coerce.boolean().optional(),
  // By default, soft-deleted rows are hidden — same reasoning as any
  // isDeleted-backed module. Pass includeDeleted=true to see them too
  // (e.g. an "Archived" tab on the listing page).
  includeDeleted: z.coerce.boolean().default(false),
  sortBy: z.enum(['id', 'createdAt', 'powerPs', 'claimedFe']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const powertrainIceIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Every numeric/decimal spec field is optional — a powertrain row is
// filled in progressively by the content team as spec-sheet data comes
// in, unlike Variant where the frontend always submits a complete form.
// Only variantId + fuelType are mandatory to create a row at all.
const powertrainIceCreateShape = {
  variantId: z.coerce.number().int().positive('variantId is required'),
  fuelType: z.enum(FUEL_TYPES, {
    required_error: 'Fuel type is required',
    invalid_type_error: 'Fuel type is required',
  }),
  fuelTypeSubCategory: z.string().trim().max(30).optional(),
  fuelTankCapacity: z.coerce.number().nonnegative().optional(),
  cngTankCapacity: z.coerce.number().nonnegative().optional(),
  kerbWeight: z.coerce.number().int().nonnegative().optional(),
  engineDisplacement: z.coerce.number().nonnegative().optional(),
  cubicCapacity: z.coerce.number().int().nonnegative().optional(),
  cylinders: z.coerce.number().int().nonnegative().optional(),
  cylinderCapacity: z.coerce.number().nonnegative().optional(),
  transmissionType: z.enum(TRANSMISSION_TYPES).optional(),
  transmissionSubType: z.string().trim().max(20).optional(),
  transmissionSpeed: z.coerce.number().int().nonnegative().optional(),
  numGears: z.coerce.number().int().nonnegative().optional(),
  isFourByFour: z.boolean().default(false),
  drivetrain: z.enum(DRIVETRAINS).optional(),
  powerPs: z.coerce.number().int().nonnegative().optional(),
  powerMinRpm: z.coerce.number().int().nonnegative().optional(),
  powerMaxRpm: z.coerce.number().int().nonnegative().optional(),
  powerWeight: z.coerce.number().nonnegative().optional(),
  torqueNm: z.coerce.number().int().nonnegative().optional(),
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
  // Only one ICE powertrain per variant can be "default" — enforced in
  // the service layer by un-defaulting siblings, same idea as a
  // single-primary-image rule.
  isDefault: z.boolean().default(false),
};

export const createPowertrainIceSchema = z.object(powertrainIceCreateShape);

// Update is a partial PATCH — same convention as Brand/CarModel, not
// Variant's "always full form" rule. Fields that are nullable in the DB
// accept an explicit `null` here so the frontend can clear a value that
// was previously set (e.g. clearing cngTankCapacity on a petrol-only
// variant that was mistakenly marked CNG).
export const updatePowertrainIceSchema = z
  .object({
    variantId: z.coerce.number().int().positive().optional(),
    fuelType: z.enum(FUEL_TYPES).optional(),
    fuelTypeSubCategory: z.string().trim().max(30).nullable().optional(),
    fuelTankCapacity: z.coerce.number().nonnegative().nullable().optional(),
    cngTankCapacity: z.coerce.number().nonnegative().nullable().optional(),
    kerbWeight: z.coerce.number().int().nonnegative().nullable().optional(),
    engineDisplacement: z.coerce.number().nonnegative().nullable().optional(),
    cubicCapacity: z.coerce.number().int().nonnegative().nullable().optional(),
    cylinders: z.coerce.number().int().nonnegative().nullable().optional(),
    cylinderCapacity: z.coerce.number().nonnegative().nullable().optional(),
    transmissionType: z.enum(TRANSMISSION_TYPES).nullable().optional(),
    transmissionSubType: z.string().trim().max(20).nullable().optional(),
    transmissionSpeed: z.coerce.number().int().nonnegative().nullable().optional(),
    numGears: z.coerce.number().int().nonnegative().nullable().optional(),
    isFourByFour: z.boolean().optional(),
    drivetrain: z.enum(DRIVETRAINS).nullable().optional(),
    powerPs: z.coerce.number().int().nonnegative().nullable().optional(),
    powerMinRpm: z.coerce.number().int().nonnegative().nullable().optional(),
    powerMaxRpm: z.coerce.number().int().nonnegative().nullable().optional(),
    powerWeight: z.coerce.number().nonnegative().nullable().optional(),
    torqueNm: z.coerce.number().int().nonnegative().nullable().optional(),
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
export type FuelType = (typeof FUEL_TYPES)[number];
export type IceTransmissionType = (typeof TRANSMISSION_TYPES)[number];
export type Drivetrain = (typeof DRIVETRAINS)[number];
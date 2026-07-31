// src/modules/newCars/powertrainElectric/powertrainElectric.validation.ts

import { z } from 'zod';

export const powertrainElectricListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  variantId: z.coerce.number().int().positive().optional(),
  isDefault: z.coerce.boolean().optional(),
  includeDeleted: z.coerce.boolean().default(false),
  sortBy: z.enum(['id', 'createdAt', 'claimedRange', 'powerPs']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const powertrainElectricIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// All optional fields below are .nullable() as well as .optional() — the
// frontend sends explicit null (not an omitted key) for a blank field, and
// .optional() alone only permits undefined, not null.
const powertrainElectricCreateShape = {
  variantId: z.coerce.number().int().positive('variantId is required'),
  numMotors: z.coerce.number().int().nonnegative().nullable().optional(),
  motorType: z.string().trim().max(50).nullable().optional(),
  // Core spec fields — required so a powertrain row can't be saved
  // half-empty. Everything else here stays optional (varies by source /
  // may not be published yet).
  batteryCapacity: z.coerce.number().positive('Battery capacity is required'),
  batteryChemistry: z.string().trim().max(30).nullable().optional(),
  thermalManagementSystem: z.string().trim().max(50).nullable().optional(),
  drivetrainId: z.coerce.number().int().positive('Drivetrain is required'),
  powerPs: z.coerce.number().int().positive('Power (PS) is required'),
  torqueNm: z.coerce.number().int().positive('Torque (Nm) is required'),
  claimedRange: z.coerce.number().int().positive('Claimed range is required'),
  realWorldRange: z.coerce.number().int().nonnegative().nullable().optional(),
  topSpeedKmph: z.coerce.number().int().nonnegative().nullable().optional(),
  topSpeedTimeSec: z.coerce.number().nonnegative().nullable().optional(),
  acChargingOutput: z.coerce.number().nonnegative().nullable().optional(),
  acChargingTime: z.coerce.number().nonnegative().nullable().optional(),
  dcChargingOutput: z.coerce.number().nonnegative().nullable().optional(),
  dcFastChargingTime: z.string().trim().max(50).nullable().optional(),
  batteryWarrantyKm: z.coerce.number().int().nonnegative().nullable().optional(),
  batteryWarrantyYears: z.coerce.number().int().nonnegative().nullable().optional(),
  motorWarrantyKm: z.coerce.number().int().nonnegative().nullable().optional(),
  motorWarrantyYears: z.coerce.number().int().nonnegative().nullable().optional(),
  standardWarrantyKm: z.string().trim().max(20).nullable().optional(),
  standardWarrantyYears: z.coerce.number().int().nonnegative().nullable().optional(),
  emissionNormCompliance: z.string().trim().max(30).nullable().optional(),
  motorPowerKw: z.coerce.number().nonnegative().nullable().optional(),
  chargingPort: z.string().trim().max(30).nullable().optional(),
  chargingOptionsRaw: z.string().trim().max(255).nullable().optional(),
  regenerativeBraking: z.boolean().default(false),
  regenerativeBrakingLevels: z.coerce.number().int().nonnegative().nullable().optional(),
  isDefault: z.boolean().default(false),
};

export const createPowertrainElectricSchema = z.object(powertrainElectricCreateShape);

export const updatePowertrainElectricSchema = z
  .object({
    variantId: z.coerce.number().int().positive().optional(),
    numMotors: z.coerce.number().int().nonnegative().nullable().optional(),
    motorType: z.string().trim().max(50).nullable().optional(),
    // Same core-required fields as create — .nullable() removed so an
    // update can't null these back out, but still .optional() so a PATCH
    // that doesn't touch them is fine.
    batteryCapacity: z.coerce.number().positive('Battery capacity is required').optional(),
    batteryChemistry: z.string().trim().max(30).nullable().optional(),
    thermalManagementSystem: z.string().trim().max(50).nullable().optional(),
    drivetrainId: z.coerce.number().int().positive('Drivetrain is required').optional(),
    powerPs: z.coerce.number().int().positive('Power (PS) is required').optional(),
    torqueNm: z.coerce.number().int().positive('Torque (Nm) is required').optional(),
    claimedRange: z.coerce.number().int().positive('Claimed range is required').optional(),
    realWorldRange: z.coerce.number().int().nonnegative().nullable().optional(),
    topSpeedKmph: z.coerce.number().int().nonnegative().nullable().optional(),
    topSpeedTimeSec: z.coerce.number().nonnegative().nullable().optional(),
    acChargingOutput: z.coerce.number().nonnegative().nullable().optional(),
    acChargingTime: z.coerce.number().nonnegative().nullable().optional(),
    dcChargingOutput: z.coerce.number().nonnegative().nullable().optional(),
    dcFastChargingTime: z.string().trim().max(50).nullable().optional(),
    batteryWarrantyKm: z.coerce.number().int().nonnegative().nullable().optional(),
    batteryWarrantyYears: z.coerce.number().int().nonnegative().nullable().optional(),
    motorWarrantyKm: z.coerce.number().int().nonnegative().nullable().optional(),
    motorWarrantyYears: z.coerce.number().int().nonnegative().nullable().optional(),
    standardWarrantyKm: z.string().trim().max(20).nullable().optional(),
    standardWarrantyYears: z.coerce.number().int().nonnegative().nullable().optional(),
    emissionNormCompliance: z.string().trim().max(30).nullable().optional(),
    motorPowerKw: z.coerce.number().nonnegative().nullable().optional(),
    chargingPort: z.string().trim().max(30).nullable().optional(),
    chargingOptionsRaw: z.string().trim().max(255).nullable().optional(),
    regenerativeBraking: z.boolean().optional(),
    regenerativeBrakingLevels: z.coerce.number().int().nonnegative().nullable().optional(),
    isDefault: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export type PowertrainElectricListQueryParsed = z.infer<typeof powertrainElectricListQuerySchema>;
export type CreatePowertrainElectricParsed = z.infer<typeof createPowertrainElectricSchema>;
export type UpdatePowertrainElectricParsed = z.infer<typeof updatePowertrainElectricSchema>;

// src/modules/newCars/feature/feature.validation.ts

import { z } from 'zod';

export const featureListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  variantId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['id', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const featureIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Only variantId is mandatory — a feature sheet is filled in
// progressively by the content team as spec-sheet data comes in, same
// reasoning as PowertrainIce. Every safety/comfort/tech field is
// optional; booleans default to false so a partially-filled sheet still
// renders sensibly on the frontend.
const featureCreateShape = {
  variantId: z.coerce.number().int().positive('variantId is required'),
  airbagsCount: z.coerce.number().int().nonnegative().optional(),
  absWithEbd: z.boolean().default(false),
  esc: z.boolean().default(false),
  hillAssist: z.boolean().default(false),
  rearParkingCamera: z.boolean().default(false),
  frontParkingSensors: z.boolean().default(false),
  tpms: z.boolean().default(false),
  isofixMounts: z.boolean().default(false),
  ncapRating: z.coerce.number().min(0).max(5).optional(),
  sunroof: z.boolean().default(false),
  keylessEntry: z.boolean().default(false),
  pushButtonStart: z.boolean().default(false),
  cruiseControl: z.boolean().default(false),
  climateControl: z.boolean().default(false),
  rearAcVents: z.boolean().default(false),
  autoDimmingMirror: z.boolean().default(false),
  powerWindows: z.boolean().default(false),
  upholsteryType: z.string().trim().max(30).optional(),
  adjustableSeats: z.boolean().default(false),
  ventilatedSeats: z.boolean().default(false),
  rearArmrest: z.boolean().default(false),
  ledHeadlamps: z.boolean().default(false),
  ledDrls: z.boolean().default(false),
  alloyWheels: z.boolean().default(false),
  roofRails: z.boolean().default(false),
  fogLamps: z.boolean().default(false),
  touchscreenSizeInch: z.coerce.number().nonnegative().optional(),
  androidAuto: z.boolean().default(false),
  appleCarplay: z.boolean().default(false),
  connectedCarTech: z.boolean().default(false),
  numberOfSpeakers: z.coerce.number().int().nonnegative().optional(),
  wirelessCharging: z.boolean().default(false),
  extraFeatures: z.string().trim().min(1).optional(),
};

export const createFeatureSchema = z.object(featureCreateShape);

// Update is a partial PATCH — same convention as PowertrainIce/Color.
// Nullable fields accept an explicit `null` so the frontend can clear a
// value that was previously set (e.g. clearing upholsteryType).
export const updateFeatureSchema = z
  .object({
    variantId: z.coerce.number().int().positive().optional(),
    airbagsCount: z.coerce.number().int().nonnegative().nullable().optional(),
    absWithEbd: z.boolean().optional(),
    esc: z.boolean().optional(),
    hillAssist: z.boolean().optional(),
    rearParkingCamera: z.boolean().optional(),
    frontParkingSensors: z.boolean().optional(),
    tpms: z.boolean().optional(),
    isofixMounts: z.boolean().optional(),
    ncapRating: z.coerce.number().min(0).max(5).nullable().optional(),
    sunroof: z.boolean().optional(),
    keylessEntry: z.boolean().optional(),
    pushButtonStart: z.boolean().optional(),
    cruiseControl: z.boolean().optional(),
    climateControl: z.boolean().optional(),
    rearAcVents: z.boolean().optional(),
    autoDimmingMirror: z.boolean().optional(),
    powerWindows: z.boolean().optional(),
    upholsteryType: z.string().trim().max(30).nullable().optional(),
    adjustableSeats: z.boolean().optional(),
    ventilatedSeats: z.boolean().optional(),
    rearArmrest: z.boolean().optional(),
    ledHeadlamps: z.boolean().optional(),
    ledDrls: z.boolean().optional(),
    alloyWheels: z.boolean().optional(),
    roofRails: z.boolean().optional(),
    fogLamps: z.boolean().optional(),
    touchscreenSizeInch: z.coerce.number().nonnegative().nullable().optional(),
    androidAuto: z.boolean().optional(),
    appleCarplay: z.boolean().optional(),
    connectedCarTech: z.boolean().optional(),
    numberOfSpeakers: z.coerce.number().int().nonnegative().nullable().optional(),
    wirelessCharging: z.boolean().optional(),
    extraFeatures: z.string().trim().min(1).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export type FeatureListQueryParsed = z.infer<typeof featureListQuerySchema>;
export type CreateFeatureParsed = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureParsed = z.infer<typeof updateFeatureSchema>;
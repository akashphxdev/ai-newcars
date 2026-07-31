// src/modules/newCars/image/image.validation.ts

import { z } from 'zod';

// Mirrors CarDekho's own gallery sub-categories (used as the reference
// vocabulary since it's the richest available breakdown) — 'other' is
// kept as a catch-all for anything that doesn't fit.
const ANGLES = [
  'looks',
  'details',
  'lights',
  'badges',
  'camera_and_sensors',
  'other_information',
  'dashboard',
  'steering_wheel',
  'instrument_cluster',
  'center_console',
  'seats',
  'storage',
  'boot',
  'infotainment_system',
  'air-conditioning',
  'sunroof',
  'controls_and_buttons',
  'charging_options',
  'seat_ventilation',
  'safety',
  'other_features',
  'other',
] as const;

// Create/update requests are sent as multipart FormData (the image
// file itself), so booleans arrive as the strings "true"/"false"
// instead of real JS booleans — same coercion as brand.validation.ts's
// booleanish.
const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const imageListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Images are always scoped to a car model — required for the admin
  // panel's "select a model, then manage its gallery" workflow.
  modelId: z.coerce.number().int().positive().optional(),
  // Or narrow to images tagged with one specific color (colorId is
  // nullable the same way — null means "not tied to a particular color").
  colorId: z.coerce.number().int().positive().optional(),
  angle: z.enum(ANGLES).optional(),
  isPrimary: z.coerce.boolean().optional(),
  sortBy: z.enum(['id', 'isPrimary']).default('id'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const imageIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createImageSchema = z.object({
  modelId: z.coerce.number().int().positive('modelId is required'),
  colorId: z.coerce.number().int().positive().optional(),
  isPrimary: booleanish.optional(),
  angle: z.enum(ANGLES).optional(),
});

export const updateImageSchema = z
  .object({
    modelId: z.coerce.number().int().positive().optional(),
    colorId: z.coerce.number().int().positive().nullable().optional(),
    isPrimary: booleanish.optional(),
    angle: z.enum(ANGLES).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export const setPrimaryImageSchema = z.object({
  isPrimary: z.boolean(),
});

// POST /images/bulk — same scoping fields as a single create, applied to
// every file in the batch. isPrimary is deliberately not offered here:
// "which one photo is the cover shot" should stay an explicit single
// choice made afterwards, not implied by upload order.
export const bulkCreateImagesSchema = z.object({
  modelId: z.coerce.number().int().positive('modelId is required'),
  colorId: z.coerce.number().int().positive().optional(),
  angle: z.enum(ANGLES).optional(),
});

export type ImageListQueryParsed = z.infer<typeof imageListQuerySchema>;
export type CreateImageParsed = z.infer<typeof createImageSchema>;
export type UpdateImageParsed = z.infer<typeof updateImageSchema>;
export type SetPrimaryImageParsed = z.infer<typeof setPrimaryImageSchema>;
export type BulkCreateImagesParsed = z.infer<typeof bulkCreateImagesSchema>;
// src/modules/newCars/image/image.validation.ts

import { z } from 'zod';

const ANGLES = [
  'front',
  'rear',
  'side',
  'interior',
  'dashboard',
  'boot',
  'wheel',
  'top',
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
  // Optionally narrow further to images belonging to one specific
  // variant (a CarImage's variantId is nullable — null means "applies
  // to the model generally, not one particular variant").
  variantId: z.coerce.number().int().positive().optional(),
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
  variantId: z.coerce.number().int().positive().optional(),
  isPrimary: booleanish.optional(),
  angle: z.enum(ANGLES).optional(),
});

export const updateImageSchema = z
  .object({
    modelId: z.coerce.number().int().positive().optional(),
    variantId: z.coerce.number().int().positive().nullable().optional(),
    isPrimary: booleanish.optional(),
    angle: z.enum(ANGLES).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export const setPrimaryImageSchema = z.object({
  isPrimary: z.boolean(),
});

export type ImageListQueryParsed = z.infer<typeof imageListQuerySchema>;
export type CreateImageParsed = z.infer<typeof createImageSchema>;
export type UpdateImageParsed = z.infer<typeof updateImageSchema>;
export type SetPrimaryImageParsed = z.infer<typeof setPrimaryImageSchema>;
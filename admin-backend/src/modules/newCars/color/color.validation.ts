// src/modules/newCars/color/color.validation.ts

import { z } from 'zod';

const hexRegex = /^#[0-9a-fA-F]{6}$/;

// Create/update requests are sent as multipart FormData (optional swatch/
// color image), so booleans arrive as the strings "true"/"false" instead
// of real JS booleans — same coercion as brand.validation.ts's booleanish.
const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const colorListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  // Colors are always scoped to a car model — required for the admin
  // panel's "select a model, then manage its colors" workflow.
  modelId: z.coerce.number().int().positive().optional(),
  isDualTone: z.coerce.boolean().optional(),
  sortBy: z.enum(['colorName', 'id']).default('id'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const colorIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createColorSchema = z.object({
  modelId: z.coerce.number().int().positive('modelId is required'),
  colorName: z.string().trim().min(1, 'Color name is required').max(50),
  colorHex: z
    .string()
    .trim()
    .regex(hexRegex, 'colorHex must be a 6-digit hex code (e.g. "#FFFFFF")')
    .optional(),
  isDualTone: booleanish.optional(),
  additionalCost: z.coerce.number().nonnegative().optional(),
});

export const updateColorSchema = z
  .object({
    modelId: z.coerce.number().int().positive().optional(),
    colorName: z.string().trim().min(1).max(50).optional(),
    colorHex: z.string().trim().regex(hexRegex).nullable().optional(),
    isDualTone: booleanish.optional(),
    additionalCost: z.coerce.number().nonnegative().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export type ColorListQueryParsed = z.infer<typeof colorListQuerySchema>;
export type CreateColorParsed = z.infer<typeof createColorSchema>;
export type UpdateColorParsed = z.infer<typeof updateColorSchema>;
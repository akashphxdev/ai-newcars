// src/modules/newCars/color/color.validation.ts

import { z } from 'zod';

const hexRegex = /^#[0-9a-fA-F]{6}$/;
const MAX_SHADES = 4;

// A color can be a single shade or a "mix" of several (formerly the
// isDualTone flag + one colorHex — now an open-ended list of 0..MAX_SHADES
// hex codes). Multer gives repeated FormData fields as an array already;
// normalize a lone string (single shade submitted) into a 1-item array too.
const colorHexesField = z.preprocess((val) => {
  if (val == null || val === '') return undefined;
  return Array.isArray(val) ? val : [val];
}, z
  .array(z.string().trim().regex(hexRegex, 'Each shade must be a 6-digit hex code (e.g. "#FFFFFF")'))
  .max(MAX_SHADES, `A color can have at most ${MAX_SHADES} shades`)
  .optional());

export const colorListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  // Colors are always scoped to a car model — required for the admin
  // panel's "select a model, then manage its colors" workflow.
  modelId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['colorName', 'id']).default('id'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const colorIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createColorSchema = z.object({
  modelId: z.coerce.number().int().positive('modelId is required'),
  colorName: z.string().trim().min(1, 'Color name is required').max(50),
  // Optional — some colors are represented by name + swatch photo alone,
  // with no hex codes at all.
  colorHexes: colorHexesField,
  additionalCost: z.coerce.number().nonnegative().optional(),
});

export const updateColorSchema = z
  .object({
    modelId: z.coerce.number().int().positive().optional(),
    colorName: z.string().trim().min(1).max(50).optional(),
    // If provided, REPLACES the color's full shade list (not a merge/patch
    // of individual shades) — send the complete desired list each time.
    colorHexes: colorHexesField,
    additionalCost: z.coerce.number().nonnegative().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export type ColorListQueryParsed = z.infer<typeof colorListQuerySchema>;
export type CreateColorParsed = z.infer<typeof createColorSchema>;
export type UpdateColorParsed = z.infer<typeof updateColorSchema>;
// src/modules/newCars/carModels/carModel.validation.ts

import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const BODY_TYPES = [
  'hatchback',
  'sedan',
  'suv',
  'muv',
  'coupe',
  'convertible',
  'pickup',
  'van',
] as const;

const LAUNCH_STATUSES = ['available', 'upcoming', 'discontinued'] as const;

export const carModelListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  brandId: z.coerce.number().int().positive().optional(),
  bodyType: z.enum(BODY_TYPES).optional(),
  launchStatus: z.enum(LAUNCH_STATUSES).optional(),
  sortBy: z.enum(['name', 'id', 'priceMin', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const carModelIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

function refinePriceRange<T extends { priceMin?: number; priceMax?: number }>(data: T) {
  if (typeof data.priceMin === 'number' && typeof data.priceMax === 'number') {
    return data.priceMax >= data.priceMin;
  }
  return true;
}

export const createCarModelSchema = z
  .object({
    brandId: z.coerce.number().int().positive('brandId is required'),
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),

    // Slug stays optional by design — it's auto-generated from `name` when
    // omitted (see generateUniqueSlug in the service). Forcing it here would
    // just make callers retype something we can derive safely.
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(100)
      .regex(slugRegex, 'Slug must be lowercase letters/numbers separated by hyphens (e.g. "creta-2026")')
      .optional(),
    // Required going forward — every car model needs a body type and a
    // price range for the public site's filters/cards to work correctly.
    bodyType: z.enum(BODY_TYPES, { errorMap: () => ({ message: 'Body type is required' }) }),
    launchStatus: z.enum(LAUNCH_STATUSES).default('available'),
    expectedLaunchDate: z.coerce.date().optional(),
    priceMin: z.coerce.number().nonnegative('Price min is required'),
    priceMax: z.coerce.number().nonnegative('Price max is required'),
  })
  .refine(refinePriceRange, {
    message: 'priceMax must be greater than or equal to priceMin',
    path: ['priceMax'],
  })
  // expectedLaunchDate is conditionally required — only meaningful (and
  // mandatory) when the model is actually "upcoming".
  .refine((data) => data.launchStatus !== 'upcoming' || !!data.expectedLaunchDate, {
    message: 'Expected launch date is required when launch status is "upcoming"',
    path: ['expectedLaunchDate'],
  });

// NOTE ON REQUIRED FIELDS: bodyType/priceMin/priceMax/expectedLaunchDate are
// mandatory on CREATE (see createCarModelSchema above). This schema (for
// PATCH) is intentionally kept partial — that's standard REST PATCH
// semantics (send only the fields you're changing). A field is never wiped
// out by omission here; explicit `null` is required to clear it.
export const updateCarModelSchema = z
  .object({
    brandId: z.coerce.number().int().positive().optional(),
    name: z.string().trim().min(2).max(100).optional(),
    slug: z.string().trim().toLowerCase().min(2).max(100).regex(slugRegex).optional(),
    bodyType: z.enum(BODY_TYPES).nullable().optional(),
    launchStatus: z.enum(LAUNCH_STATUSES).optional(),
    // Explicit null clears an already-set expected launch date (e.g.
    // once a model actually launches and moves to "available").
    expectedLaunchDate: z.coerce.date().nullable().optional(),
    priceMin: z.coerce.number().nonnegative().nullable().optional(),
    priceMax: z.coerce.number().nonnegative().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  })
  .refine(
    (data) =>
      refinePriceRange({
        priceMin: data.priceMin ?? undefined,
        priceMax: data.priceMax ?? undefined,
      }),
    { message: 'priceMax must be greater than or equal to priceMin', path: ['priceMax'] },
  );
export const updateCarModelLaunchStatusSchema = z.object({
  launchStatus: z.enum(LAUNCH_STATUSES),
});

export type CarModelListQueryParsed = z.infer<typeof carModelListQuerySchema>;
export type CreateCarModelParsed = z.infer<typeof createCarModelSchema>;
export type UpdateCarModelParsed = z.infer<typeof updateCarModelSchema>;
export type UpdateCarModelLaunchStatusParsed = z.infer<typeof updateCarModelLaunchStatusSchema>;
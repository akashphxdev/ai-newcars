// src/modules/newCars/carModels/carModel.validation.ts

import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const LAUNCH_STATUSES = ['available', 'upcoming', 'discontinued'] as const;

export const carModelListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  search: z.string().trim().min(1).optional(),
  brandId: z.coerce.number().int().positive().optional(),
  bodyTypeId: z.coerce.number().int().positive().optional(),
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
    // Now an FK into the body_types table rather than a hardcoded enum.
    bodyTypeId: z.coerce.number().int().positive('Body type is required'),
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

export const updateCarModelSchema = z
  .object({
    brandId: z.coerce.number().int().positive().optional(),
    name: z.string().trim().min(2).max(100).optional(),
    slug: z.string().trim().toLowerCase().min(2).max(100).regex(slugRegex).optional(),
    // No longer nullable — bodyType is a required business field (same as
    // create). Omit the key to leave it unchanged; you can no longer send
    // `null` to silently clear it out.
    bodyTypeId: z.coerce.number().int().positive('Body type is required').optional(),
    launchStatus: z.enum(LAUNCH_STATUSES).optional(),
    // Explicit null clears an already-set expected launch date (e.g.
    // once a model actually launches and moves to "available").
    expectedLaunchDate: z.coerce.date().nullable().optional(),
    // No longer nullable — price range is required (same as create).
    priceMin: z.coerce.number().nonnegative('Price min is required').optional(),
    priceMax: z.coerce.number().nonnegative('Price max is required').optional(),
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
  )
  // Same conditional rule as create: if the caller is explicitly setting
  // launchStatus to "upcoming" in this request, a date must come with it.
  // (The case where launchStatus is left unchanged but was already
  // "upcoming" is enforced in the service, where the existing record's
  // current status/date is known.)
  .refine((data) => data.launchStatus !== 'upcoming' || !!data.expectedLaunchDate, {
    message: 'Expected launch date is required when launch status is "upcoming"',
    path: ['expectedLaunchDate'],
  });

export const updateCarModelLaunchStatusSchema = z
  .object({
    launchStatus: z.enum(LAUNCH_STATUSES),
    // Required specifically when the new status is "upcoming" — see
    // refine below. This is what the row-level quick-status dropdown on
    // the listing page now needs to send.
    expectedLaunchDate: z.coerce.date().optional(),
  })
  .refine((data) => data.launchStatus !== 'upcoming' || !!data.expectedLaunchDate, {
    message: 'Expected launch date is required when launch status is "upcoming"',
    path: ['expectedLaunchDate'],
  });

export type CarModelListQueryParsed = z.infer<typeof carModelListQuerySchema>;
export type CreateCarModelParsed = z.infer<typeof createCarModelSchema>;
export type UpdateCarModelParsed = z.infer<typeof updateCarModelSchema>;
export type UpdateCarModelLaunchStatusParsed = z.infer<typeof updateCarModelLaunchStatusSchema>;
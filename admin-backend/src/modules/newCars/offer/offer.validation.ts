// src/modules/newCars/offer/offer.validation.ts

import { z } from 'zod';

// Numeric codes only — labels live on the frontend
// (front/src/lib/lookups.ts's OFFER_TYPE_OPTIONS). Backend just needs
// to know which codes are currently valid.
//   1 = Cash discount, 2 = Exchange bonus, 3 = Corporate discount,
//   4 = Loyalty bonus, 5 = Finance offer, 6 = Other
export const OFFER_TYPE_CODES = [1, 2, 3, 4, 5, 6] as const;

// FormData (multipart, used on create/update since an image file rides
// along) serializes booleans as the strings "true"/"false" — plain
// z.boolean() rejects those outright. Same fix as
// brand.validation.ts's `booleanish`.
//
// This same helper is ALSO the fix for query-string filtering: plain
// z.coerce.boolean() just runs Boolean(value), so the STRING "false"
// (non-empty) incorrectly coerces to `true`. Using `booleanish` for the
// list-query isActive filter too fixes the "Inactive" filter returning
// Active offers.
const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const offerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  modelId: z.coerce.number().int().positive().optional(),
  variantId: z.coerce.number().int().positive().optional(),
  cityId: z.coerce.number().int().positive().optional(),
  isActive: booleanish.optional(),
  sortBy: z.enum(['id', 'validFrom', 'validUntil', 'offerAmount']).default('id'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const offerIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// modelId is the only mandatory field — everything else mirrors the
// schema's own nullability (variantId/cityId/offerType/offerAmount/
// description/validFrom/validUntil are all optional columns).
// Both create and update share this shape (full-replace on edit, same
// convention as faq.validation.ts / variant.validation.ts) — the
// frontend always submits the complete form on Add and Edit.
const offerShape = {
  modelId: z.coerce.number().int().positive('modelId is required'),
  variantId: z.coerce.number().int().positive().nullable().optional(),
  cityId: z.coerce.number().int().positive().nullable().optional(),
  offerType: z.coerce
    .number()
    .int()
    .refine((v) => (OFFER_TYPE_CODES as readonly number[]).includes(v), 'Invalid offerType code')
    .nullable()
    .optional(),
  offerAmount: z.coerce.number().positive('Offer amount must be greater than 0').nullable().optional(),
  description: z.string().trim().max(255).nullable().optional(),
  validFrom: z.coerce.date().nullable().optional(),
  validUntil: z.coerce.date().nullable().optional(),
  isActive: booleanish,
};

export const createOfferSchema = z
  .object(offerShape)
  .refine(
    (data) => !data.validFrom || !data.validUntil || data.validFrom <= data.validUntil,
    { message: 'validFrom must be on or before validUntil', path: ['validUntil'] },
  );

export const updateOfferSchema = createOfferSchema;

export const updateOfferStatusSchema = z.object({
  isActive: booleanish,
});

export type OfferListQueryParsed = z.infer<typeof offerListQuerySchema>;
export type CreateOfferParsed = z.infer<typeof createOfferSchema>;
export type UpdateOfferParsed = z.infer<typeof updateOfferSchema>;
export type UpdateOfferStatusParsed = z.infer<typeof updateOfferStatusSchema>;